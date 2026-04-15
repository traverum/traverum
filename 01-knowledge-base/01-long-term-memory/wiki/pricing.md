---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/pricing.md
  - system/booking-flow.md
tags: [pricing, money, cents, rental, session]
---

# Pricing

Flexible enough for different experience types without confusing suppliers or guests.

## Four pricing models

| Model | Use case | Formula |
|-------|----------|---------|
| **Per person** | Tours, classes, tastings | price × participants |
| **Flat rate** | Private charters, exclusive | Fixed price regardless of group |
| **Base + extra** | Vehicles with seats, packages | base + extra per person beyond included count |
| **Per day (rental)** | Vespa, car, equipment | price per day × days × quantity |

## Money in cents

All prices stored as integer cents with `_cents` suffix. Never floats. Display as EUR using Finnish locale: `45 €`, not `€45`. Use `Intl.NumberFormat('fi-FI')`.

## Session price override

Any session can override the unit price. The override replaces the per-unit price and scales with quantity — not a flat total.

- `per_person`: `override × participants`
- `flat_rate`: `override` (constant)
- `per_day`: `override × days × quantity`

Useful for promotions, peak pricing, or special events.

## Minimum participants

`min_participants` is a UI booking minimum. The widget's participant selector starts at `min_participants` — guests cannot choose fewer. Not a backend pricing multiplier. "Minimum 2 people" means you can't book for 1.

## Rental pricing specifics

- Guest picks start date + number of days from a dropdown (not a date range)
- Quantity = number of units (e.g. 2 Vespas), stored in `participants` field
- Always request-based — no instant booking for rentals
- No inventory tracking — supplier decides manually
- `rental_end_date` is inclusive (see [[booking]] for computation)

## [[Commission]] split

Applies automatically after price calculation. See [[commission]] for split logic and rounding.

## Related pages

- [[booking]] — Flow that uses pricing
- [[commission]] — Revenue split after pricing
- [[payment-modes]] — How the calculated price is collected
