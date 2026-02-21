# Pricing

## Purpose

Pricing must be flexible enough to cover different experience types without being confusing for suppliers or guests.

**For the supplier:** Set up pricing once, let the system calculate everything. No manual math, no invoice generation. Override a session price for promotions. Set minimum booking sizes to protect profitability.

**For the guest:** See clear, predictable pricing. Understand exactly what they'll pay before checkout. No hidden fees, no surprises.

**For the platform:** Store everything in cents to avoid floating-point errors. Commission split is automatic and accurate.

## Key decisions

### Four pricing models

| Model | Use case | Formula |
|-------|----------|---------|
| **Per person** | Tours, classes, tastings | price × participants |
| **Flat rate** | Private charters, exclusive experiences | fixed price regardless of group |
| **Base + extra** | Vehicles with seats, packages | base price + extra per person beyond included count |
| **Per day (rental)** | Vespa, car, equipment rentals | price per day × days × quantity |

### Money in cents

All prices stored as integer cents with `_cents` suffix. Never floats. Display as EUR using Finnish locale (`45 €`, not `€45`). Commission splits use `Math.round()`, remainder to platform.

### Session price override

Any session can override the unit price. The override replaces the per-unit price and scales with quantity — it's not a flat total. Useful for promotions, peak pricing, or special events.

### Minimum participants

Suppliers can set a minimum booking size. The widget enforces this — the participant selector starts at the minimum. Protects against unprofitably small bookings.

### Rental pricing specifics

- Guest picks a start date + number of days from a dropdown (not a date range)
- Quantity = number of units (e.g., 2 Vespas), stored in `participants` field
- Always request-based — no instant booking for rentals
- No inventory tracking — supplier decides manually what to accept

## Reference

- Full calculations: `docs/technical/pricing-calculations.md`
- Cursor rule: `.cursor/rules/currency-pricing.mdc`
- Code: `apps/widget/src/lib/pricing.ts`, `apps/widget/src/lib/commission.ts`
