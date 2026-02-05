# Traverum Pricing Systems

> **Document Purpose**: Complete specification of all pricing models supported by Traverum
> **Last Updated**: January 2025

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
| `min_participants` | integer | Minimum booking size - creates a "price floor" |
| `max_participants` | integer | Maximum capacity for the experience |
| `min_days` | integer | Minimum rental period in days (for `per_day` rentals) |
| `max_days` | integer | Maximum rental period in days (for `per_day` rentals, nullable) |
| `price_cents` | integer | Legacy field for backwards compatibility |

### Experience Sessions Table

| **Column** | **Purpose** |
| --- | --- |
| `price_override_cents` | If set, overrides all pricing logic with a flat amount for this specific session |

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

Where `effective_participants = max(participants, min_participants)`

### Example
**Wine tasting at 40€ per person**

- 1 guest = 40€
- 3 guests = 120€
- 10 guests = 400€

**With minimum participants**: If `min_participants = 2` and only 1 person books:
- They pay for 2 people (80€) even though they're alone
- This protects the supplier from unprofitable small bookings

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

Where `effective_participants = max(participants, min_participants)`

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

### Formula
```
days = (rental_end_date - rental_start_date) + 1
quantity = participants (repurposed as quantity)
total = price_per_day_cents × days × quantity
```

### Validation Rules
- `min_days ≤ days ≤ max_days` (if `max_days` is set)
- `days ≥ 1` (always)
- `quantity ≥ 1` (minimum 1 unit)

### Example Scenarios

**Scenario 1: Single Vespa, 3 days**
- Price: €50/day
- Quantity: 1 Vespa
- Days: Jan 15 - Jan 18 (3 days)
- Total: €50 × 3 × 1 = **€150**

**Scenario 2: Two Vespas, 3 days**
- Price: €50/day
- Quantity: 2 Vespas
- Days: Jan 15 - Jan 18 (3 days)
- Total: €50 × 3 × 2 = **€300**

**Scenario 3: Two Vespas, 5 days (with constraints)**
- Price: €50/day
- Min days: 2, Max days: 7
- Quantity: 2 Vespas
- Days: Jan 15 - Jan 20 (5 days) ✅ Valid
- Total: €50 × 5 × 2 = **€500**

**Scenario 4: Invalid rental period**
- Min days: 2, Max days: 7
- Days: 1 day ❌ Rejected (below minimum)
- Days: 10 days ❌ Rejected (above maximum)

### Database Fields Used
- `pricing_type = 'per_day'`
- `price_per_day_cents`
- `min_days`
- `max_days` (nullable)
- `min_participants` (repurposed as min quantity, typically 1)
- `max_participants` (repurposed as max quantity available)

### Reservation Fields
- `rental_start_date` (date)
- `rental_end_date` (date)
- `participants` (repurposed as quantity)

### Display
- Card: "50€ / day"
- Booking: "50€/day × 3 days × 2 Vespas = 300€"
- Period: "Jan 15 - Jan 18, 2025 (3 days)"

### Special Considerations

1. **Date Range Selection**: Unlike other pricing types that use a single date/time, rentals require a date range picker (start + end dates)

2. **Quantity vs Participants**: The `participants` field is repurposed to represent quantity (number of units) for rental experiences

3. **Availability Tracking**: For rentals, you may need to track inventory:
   - How many units are available on each date?
   - Prevent overbooking (if you have 5 Vespas, can't rent 6 on overlapping dates)
   - This may require a new `rental_availability` table or date-based inventory tracking

4. **Day Calculation**: Days are calculated inclusively: `(end_date - start_date) + 1`
   - Jan 15 to Jan 15 = 1 day
   - Jan 15 to Jan 16 = 2 days
   - Jan 15 to Jan 18 = 4 days

---

## Session Price Override

Any pricing type can be overridden at the session level using `price_override_cents` on the `experience_sessions` table.

### Behavior
- If `session.price_override_cents` is set, it takes precedence over all pricing logic
- The override applies as a flat rate for that specific session
- Useful for special promotions, peak pricing, or session-specific discounts

### Example
- Experience: Wine tasting at 40€ per person
- Session override: 35€ per person (special promotion)
- Result: All bookings for this session use 35€ regardless of pricing type

---

## Implementation Details

### Pricing Calculation Functions

#### Widget (`apps/widget/src/lib/pricing.ts`)

```typescript
calculatePrice(
  experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants' | 'min_participants' | 'price_per_day_cents' | 'min_days' | 'max_days'>,
  participants: number,
  session?: Pick<ExperienceSession, 'price_override_cents'> | null,
  rentalStartDate?: Date | null,
  rentalEndDate?: Date | null
): PriceCalculation
```

#### Dashboard (`apps/dashboard/src/lib/pricing.ts`)

```typescript
calculateTotalPrice(
  participants: number,
  pricing: PricingConfig,
  sessionPriceOverrideCents?: number | null,
  rentalDays?: number | null
): PriceCalculation
```

### Key Behaviors

1. **Minimum Enforcement**: `effective_participants = Math.max(participants, min_participants)`
   - Applies to `per_person` and `base_plus_extra` types
   - Creates a price floor to protect suppliers

2. **Session Override**: If a session has `price_override_cents`, it ignores all other pricing logic

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
1. Supplier creates experience: "Vespa Rental" at 50€/day, min 2 days, max 7 days
2. Guest selects: Jan 15 - Jan 18 (3 days), quantity: 2 Vespas
3. System validates: 2 ≤ 3 ≤ 7 ✅
4. System calculates: 50€ × 3 days × 2 Vespas = 300€
5. Guest pays 300€
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
| **Per Day** | Rentals (Vespa, car, equipment) | `price_per_day_cents`, `min_days`, `max_days` | `price × days × quantity` |

---

## Future Considerations

### Rental Inventory Management
For rental services, consider implementing:
- Date-based availability tracking
- Overlapping booking prevention
- Inventory management per date range
- Multi-unit availability (e.g., "5 Vespas available Jan 15-20")

### Advanced Pricing Features
- Seasonal pricing (different rates by date range)
- Weekend/weekday pricing
- Quantity discounts (e.g., "Rent 3+ Vespas, get 10% off")
- Early bird discounts
- Last-minute pricing

---

## Migration Notes

- Legacy `price_cents` field is maintained for backwards compatibility
- New experiences should use the appropriate pricing type fields
- Existing experiences default to `per_person` pricing type
- Session overrides provide flexibility without changing base pricing
