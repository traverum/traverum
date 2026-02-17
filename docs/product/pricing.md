# Traverum Pricing Systems

> **Document Purpose**: Complete specification of all pricing models supported by Traverum
> **Last Updated**: February 2026

---

## Overview

Traverum supports **four pricing models** to accommodate different types of experiences and services:

1. **Per Person** - Price scales with number of participants
2. **Flat Rate** - Fixed price regardless of group size
3. **Base + Extra** - Base price includes X people, then extra per additional person
4. **Per Day (Rental)** - Time-based pricing for rental services (Vespa, car rentals, etc.)

All prices are stored in **cents** (integer) to avoid floating-point precision issues, and displayed as EUR (€).

---

## Database Schema

### Experiences Table

| **Column** | **Type** | **Purpose** |
| --- | --- | --- |
| `pricing_type` | varchar | One of: `'per_person'`, `'flat_rate'`, `'base_plus_extra'`, `'per_day'` |
| `base_price_cents` | integer | Base/fixed price in cents (used for `flat_rate`, `base_plus_extra`) |
| `extra_person_cents` | integer | Price per person in cents (used for `per_person` and as "extra" in `base_plus_extra`) |
| `price_per_day_cents` | integer | Price per day in cents (used for `per_day` rentals) |
| `included_participants` | integer | How many people are included in base price (for `base_plus_extra`) |
| `min_participants` | integer | Minimum booking size — guests cannot select fewer than this many participants in the widget. |
| `max_participants` | integer | Maximum capacity for the experience |
| `min_days` | integer | Minimum rental period in days (for `per_day` rentals) |
| `max_days` | integer | Maximum rental period in days (for `per_day` rentals, nullable) |
| `price_cents` | integer | Legacy field for backwards compatibility |

### Experience Sessions Table

| **Column** | **Purpose** |
| --- | --- |
| `price_override_cents` | If set, replaces the unit price for this session and scales with quantity (see Session Price Override) |

### Reservations Table (for rentals)

| **Column** | **Purpose** |
| --- | --- |
| `rental_start_date` | Start date of rental period (for `per_day` pricing) |
| `rental_end_date` | End date of rental period (for `per_day` pricing) |
| `participants` | Number of participants (for regular experiences) or quantity (for rentals) |

---

## Pricing Type 1: Per Person (`per_person`)

### Use Cases
- Walking tours
- Wine tastings
- Cooking classes
- Group activities where each guest adds the same cost

### Formula
```
total = extra_person_cents × effective_participants
```

Where `effective_participants = participants` (always equals participants, since the widget enforces `min_participants` at selection time)

### Example
**Wine tasting at 40€ per person**

- 1 guest = 40€
- 3 guests = 120€
- 10 guests = 400€

**With minimum participants**: If `min_participants = 2`:
- The participant selector in the widget starts at 2 — guests cannot choose fewer
- This protects the supplier from unprofitable small bookings
- Note: `min_participants` is a **booking minimum** enforced at the UI level, not a backend pricing floor

### Database Fields Used
- `pricing_type = 'per_person'`
- `extra_person_cents` (or `price_cents` for legacy)
- `min_participants`
- `max_participants`

### Display
- Card: "40€ / person"
- Booking: "40€ × 3 = 120€"

---

## Pricing Type 2: Flat Rate (`flat_rate`)

### Use Cases
- Private boat charters
- Exclusive villa experiences
- Fixed-price experiences regardless of group size

### Formula
```
total = base_price_cents (constant)
```

### Example
**Private yacht at 800€**

- 2 guests = 800€
- 6 guests = 800€
- 10 guests = 800€ (up to max capacity)

### Database Fields Used
- `pricing_type = 'flat_rate'`
- `base_price_cents` (or `price_cents` for legacy)
- `max_participants` (capacity limit)

### Display
- Card: "800€ total"
- Booking: "800€ (flat rate for up to 10 guests)"

---

## Pricing Type 3: Base + Extra (`base_plus_extra`)

### Use Cases
- Safari jeep (4 seats included, charge for extras)
- Photographer packages
- Vehicles with fixed capacity + overflow

### Formula
```
extra_people = max(0, effective_participants - included_participants)
total = base_price_cents + (extra_people × extra_person_cents)
```

Where `effective_participants = participants` (always equals participants, since the widget enforces `min_participants` at selection time)

### Example
**Safari at 400€ for 4 people, +60€ per extra**

- 2 guests = 400€ (under included, still pay base)
- 4 guests = 400€ (exactly included)
- 6 guests = 400€ + (2 × 60€) = 520€
- 8 guests = 400€ + (4 × 60€) = 640€

### Database Fields Used
- `pricing_type = 'base_plus_extra'`
- `base_price_cents`
- `included_participants`
- `extra_person_cents`
- `min_participants`
- `max_participants`

### Display
- Card: "400€ for 4, +60€ per extra"
- Booking: "400€ (includes 4) + 60€ × 2 extra = 520€"

---

## Pricing Type 4: Per Day Rental (`per_day`)

### Use Cases
- Vespa rentals
- Car rentals
- Equipment rentals
- Any service priced by time period rather than participants

### How It Works

Rentals follow a simplified request-based model:

1. **Guest selects a single start date** (not a date range)
2. **Guest selects number of days** from a dropdown (constrained by `min_days` / `max_days`)
3. **Guest selects quantity** (how many units, e.g. 2 Vespas — constrained by `max_participants`)
4. **Every rental booking is a request** — supplier must accept or decline via email or dashboard
5. **No inventory tracking** — multiple guests can request the same dates. Requests are rare enough that overbooking is not a practical concern. Supplier manages availability manually.

### Formula
```
total = price_per_day_cents × days × quantity
```

Where:
- `days` = number selected by the guest (validated against `min_days` / `max_days`)
- `quantity` = `participants` field (repurposed as unit count for rentals)

### Validation Rules
- `min_days ≤ days ≤ max_days` (if `max_days` is set)
- `days ≥ 1` (always)
- `quantity ≥ 1`, `quantity ≤ max_participants`

### Example Scenarios

**Scenario 1: Single Vespa, 3 days**
- Price: €50/day
- Quantity: 1 Vespa
- Days: 3
- Total: €50 × 3 × 1 = **€150**

**Scenario 2: Two Vespas, 3 days**
- Price: €50/day
- Quantity: 2 Vespas
- Days: 3
- Total: €50 × 3 × 2 = **€300**

**Scenario 3: Invalid rental period**
- Min days: 2, Max days: 7
- Days: 1 day → Rejected (below minimum)
- Days: 10 days → Rejected (above maximum)

### Database Fields Used

**Experiences table:**
- `pricing_type = 'per_day'`
- `price_per_day_cents` — price per unit per day
- `min_days` — minimum rental period
- `max_days` (nullable) — maximum rental period
- `max_participants` — max quantity per booking (e.g. 5 vespas)

**Reservations table:**
- `requested_date` — rental start date (same field used by session requests)
- `rental_start_date` — rental start date (duplicated for clarity in queries)
- `rental_end_date` — computed server-side as `requested_date + days`
- `participants` — repurposed as quantity (number of units)
- `is_request = true` — always true for rentals
- `requested_time = null` — no time component for rentals

### Display
- Card: "50€ / day"
- Booking panel: "50€/day × 3 days × 2 units = 300€"
- Checkout summary: "Start date: Mon 20 Feb", "Duration: 3 days", "Quantity: 2"

### Key Design Decisions

1. **Single date, not date range**: Guest picks one start date and selects days from a dropdown. This is simpler than a date range picker and avoids off-by-one confusion.

2. **Always request-based**: Every rental goes through the request flow (supplier Accept/Decline). There is no instant booking for rentals.

3. **No inventory tracking**: We do not track how many units are available on each date. Rental requests are infrequent enough that the supplier can manage availability manually by accepting or declining.

4. **No sessions for rentals**: Rentals do not use `experience_sessions`. When a rental request is accepted, no session is created — the reservation goes directly to `approved` status with a payment link.

5. **`max_participants` as max quantity**: For rentals, `max_participants` represents the maximum number of units a guest can request in a single booking (e.g. "up to 5 vespas"). It is not inventory.

---

## Session Price Override

Any pricing type can be overridden at the session level using `price_override_cents` on the `experience_sessions` table.

### Behavior
- If `session.price_override_cents` is set, it **replaces the unit price** and scales with quantity
- The override is a per-unit price, not a flat total
- Useful for special promotions, peak pricing, or session-specific discounts

### How it works per pricing type

| **Pricing Type** | **Override Meaning** | **Formula** |
| --- | --- | --- |
| `per_person` | Replaces per-person price | `override × participants` |
| `base_plus_extra` | Simplifies to per-person | `override × participants` |
| `flat_rate` | Replaces the flat rate | `override` (constant) |
| `per_day` | Replaces per-day rate | `override × days × quantity` |

### Examples
- **Per person**: Wine tasting 40€/person, override 35€ → 3 guests = 35€ × 3 = **105€**
- **Flat rate**: Yacht 800€, override 700€ → **700€** (regardless of group size)
- **Per day**: Vespa 50€/day, override 40€ → 3 days × 2 = 40€ × 3 × 2 = **240€**

---

## Implementation Details

### Pricing Calculation Functions

#### Widget (`apps/widget/src/lib/pricing.ts`)

```typescript
calculatePrice(
  experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants' | 'min_participants' | 'price_per_day_cents' | 'min_days' | 'max_days'>,
  participants: number,
  session?: Pick<ExperienceSession, 'price_override_cents'> | null,
  rentalDays?: number,   // number of days for per_day pricing
  quantity?: number       // number of units for per_day pricing
): PriceCalculation
```

#### Dashboard (`apps/dashboard/src/lib/pricing.ts`)

```typescript
calculateTotalPrice(
  participants: number,
  pricing: PricingConfig,          // includes price_per_day_cents
  sessionPriceOverrideCents?: number | null,
  days?: number                    // number of days for per_day pricing
): PriceCalculation
```

#### Helper Functions (Dashboard)

```typescript
getUnitLabel(pricingType): string          // "per person" | "total" | "per day"
getDefaultUnitPrice(pricing): number       // default unit price for override placeholder
```

### Key Behaviors

1. **Minimum Guests (Booking Minimum)**: `min_participants` is enforced at the UI level
   - Applies to `per_person` and `base_plus_extra` types
   - The widget's participant selector starts at `min_participants` — guests cannot choose fewer
   - Protects suppliers from unprofitable small bookings
   - `Math.max(participants, min_participants)` exists as a safety net in the pricing functions

2. **Session Override**: If a session has `price_override_cents`, it replaces the unit price and scales with quantity (see Session Price Override section)

3. **Breakdown Strings**: Always explains the calculation (e.g., "40€ × 3 = 120€")

4. **Rental Day Validation**: For `per_day` type, validates that days are within `min_days` and `max_days` constraints

### Display Helpers

| **Function** | **Purpose** | **Example Output** |
| --- | --- | --- |
| `formatPrice(cents)` | Convert cents to EUR | `4000` → `"40€"` |
| `getPricingSummary(pricing)` | One-line summary | `"40€ per person (min. 2)"` |
| `getPriceExamples(pricing)` | Preview table | `[{participants: 2, price: "80€"}, ...]` |
| `getPriceDisplay(experience)` | Card display | `{amount: 40, suffix: " / person"}` |

---

## Where Pricing Gets Used

1. **Experience Form** (`ExperienceForm.tsx`): Supplier sets pricing type and values
2. **Booking Widget**: Customer sees calculated price based on their selection
3. **Session Detail** (`SessionDetail.tsx`): Shows price per guest and session override option
4. **Reservation Processing**: Calculates `total_cents` when customer submits a booking request
5. **Email Confirmations**: Displays pricing breakdown in booking confirmations

---

## Practical Flow Examples

### Regular Experience (Per Person)
```
1. Supplier creates experience: "Wine Tasting" at 40€/person, min 2
2. Guest selects: 3 participants
3. System calculates: max(3, 2) = 3, so 40€ × 3 = 120€
4. Guest pays 120€
```

### Rental Experience (Per Day)
```
1. Supplier creates experience: "Vespa Rental" at 50€/day, min 2 days, max 7 days, max qty 5
2. Guest selects: start date Jan 15, 3 days, quantity 2 Vespas
3. System validates: 2 ≤ 3 ≤ 7 ✅, 2 ≤ 5 ✅
4. System calculates: 50€ × 3 days × 2 Vespas = 300€
5. Guest submits request (always request-based, no instant booking)
6. Supplier accepts → guest receives payment link → guest pays 300€
```

### Session Override
```
1. Experience: "Wine Tasting" at 40€/person
2. Supplier creates session with override: 35€/person (promotion)
3. Guest books this session with 3 participants
4. System uses override: 35€ × 3 = 105€ (not 120€)
```

---

## Summary Table

| **Pricing Type** | **Best For** | **Key Fields** | **Calculation** |
| --- | --- | --- | --- |
| **Per Person** | Tours, classes, tastings | `extra_person_cents`, `min_participants` | `price × participants` |
| **Flat Rate** | Private charters, exclusive experiences | `base_price_cents`, `max_participants` | `base_price` (constant) |
| **Base + Extra** | Vehicles with seats, packages | `base_price_cents`, `included_participants`, `extra_person_cents` | `base + (extra × additional)` |
| **Per Day** | Rentals (Vespa, car, equipment) | `price_per_day_cents`, `min_days`, `max_days`, `max_participants` (max qty) | `price × days × quantity` |

---

## Future Considerations

### Advanced Pricing Features
- Seasonal pricing (different rates by date range)
- Weekend/weekday pricing
- Quantity discounts (e.g., "Rent 3+ Vespas, get 10% off")
- Early bird discounts
- Last-minute pricing
- Rental inventory tracking (date-based availability, overbooking prevention) — currently not needed due to low request volume

---

## Migration Notes

- Legacy `price_cents` field is maintained for backwards compatibility
- New experiences should use the appropriate pricing type fields
- Existing experiences default to `per_person` pricing type
- Session overrides provide flexibility without changing base pricing
