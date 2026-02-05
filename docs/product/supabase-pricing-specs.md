### Database Schema (experiences table)

The pricing system uses these columns on the experiences table:

| **Column** | **Type** | **Purpose** |
| --- | --- | --- |
| pricing_type | varchar | One of: 'per_person', 'flat_rate', 'base_plus_extra' |
| base_price_cents | integer | The base/fixed price in cents (used for flat_rate and base_plus_extra) |
| extra_person_cents | integer | Price per person in cents (used for per_person and as the "extra" in base_plus_extra) |
| included_participants | integer | How many people are included in the base price (for base_plus_extra) |
| min_participants | integer | Minimum booking size - creates a "price floor" |
| max_participants | integer | Maximum capacity for the experience |
| price_cents | integer | Legacy field for backwards compatibility |

Additionally, sessions can override the price:

| **Column (experience_sessions)** | **Purpose** |
| --- | --- |
| price_override_cents | If set, overrides all pricing logic with a flat amount |

---

### The Three Pricing Types

Diagram

---

### 1. Per Person (per_person)

**Use case**: Walking tours, wine tastings, cooking classes - where each guest adds the same cost.

**Formula**: total = extra_person_cents × participants

**Example**: Wine tasting at 40€ per person

- 1 guest = 40€
- 3 guests = 120€
- 10 guests = 400€

**With minimum participants**: If min_participants = 2 and only 1 person books:

- They pay for 2 people (80€) even though they're alone
- This protects the supplier from unprofitable small bookings

---

### 2. Flat Rate (flat_rate)

**Use case**: Private boat charters, exclusive villa experiences - fixed price regardless of group size.

**Formula**: total = base_price_cents (constant)

**Example**: Private yacht at 800€

- 2 guests = 800€
- 6 guests = 800€
- 10 guests = 800€ (up to max capacity)

---

### 3. Base + Extra (base_plus_extra)

**Use case**: Safari jeep (4 seats included, charge for extras), photographer packages.

**Formula**:

```
extra_people = max(0, participants - included_participants)
total = base_price_cents + (extra_people × extra_person_cents)

```

**Example**: Safari at 400€ for 4 people, +60€ per extra

- 2 guests = 400€ (under included, still pay base)
- 4 guests = 400€ (exactly included)
- 6 guests = 400€ + (2 × 60€) = 520€
- 8 guests = 400€ + (4 × 60€) = 640€

---

### How the Code Works

The calculateTotalPrice() function in src/lib/pricing.ts handles all calculations:

```tsx
// Input
calculateTotalPrice(
  participants:number,// How many people are booking
  pricing:PricingConfig,// The experience pricing settings
  sessionPriceOverrideCents?:number// Optional session-specific price
)

// Output
{
  total_cents:number,// Final price in cents
  breakdown:string,// Human-readable explanation
  effective_participants:number// Actual count used (respects minimum)
}

```

**Key behaviours**:

1. **Minimum enforcement**: effective_participants = Math.max(participants, min_participants)
2. **Session override**: If a session has price_override_cents, it ignores all other logic
3. **Breakdown strings**: Always explains the calculation (e.g., "40€ × 3 = 120€")

---

### Display Helpers

| **Function** | **Purpose** | **Example Output** |
| --- | --- | --- |
| formatPrice(cents) | Convert cents to EUR | 4000 → "40€" |
| getPricingSummary(pricing) | One-line summary | "40€ per person (min. 2)" |
| getPriceExamples(pricing) | Preview table | [{participants: 2, price: "80€"}, ...] |

---

### Where This Gets Used

1. **Experience Form** (ExperienceForm.tsx): Supplier sets pricing type and values
2. **Booking Widget** (future): Customer sees calculated price based on their group size
3. **Session Detail** (SessionDetail.tsx): Shows price per guest and session override option
4. **Reservation Processing**: Calculates total_cents when customer submits a booking request

---

### Practical Flow

Sequence

---

### Summary

Your pricing system is flexible and covers the main use cases:

| **Pricing Type** | **Best For** | **Key Fields** |
| --- | --- | --- |
| **Per Person** | Tours, classes, tastings | extra_person_cents, min_participants |
| **Flat Rate** | Private charters, exclusive experiences | base_price_cents, max_participants |
| **Base + Extra** | Vehicles with seats, packages | base_price_cents, included_participants, extra_person_cents |

All prices are stored in **cents** to avoid floating-point issues, and the system always respects the **minimum participants** as a price floor.