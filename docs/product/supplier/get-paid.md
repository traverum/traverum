# Get Paid

## Goal

Suppliers get paid reliably after delivering experiences. The system handles settlement automatically — no invoicing, no manual transfers, no chasing. If a supplier forgets to confirm delivery, auto-complete ensures they still get paid.

## For whom

Suppliers. This is the payoff for everything else — if getting paid feels unreliable, nothing else matters.

## Key stories

- Supplier delivers an experience → confirms completion in email or dashboard → money arrives via Stripe within days
- Supplier forgets to confirm → auto-complete kicks in 7 days after the experience → money still arrives
- Guest cancels within policy window → full refund, supplier gets nothing (fair, expected)
- Supplier cancels (weather, emergency) → full guest refund, supplier gets nothing (industry standard)

## Design decisions

### Settlement flow

1. Experience happens
2. Supplier confirms completion (email one-click or dashboard) — sets booking to `completed`
3. If supplier doesn't confirm within 7 days, auto-complete cron job sets booking to `completed`
4. Settlement cron job reads `supplier_amount_cents` from the booking record and creates a Stripe Transfer
5. Commission split is pre-calculated at booking creation time and stored on the booking record

### Auto-complete protects the supplier

The auto-complete window (7 days after experience) ensures suppliers get paid even if they never log in. This is critical because many suppliers manage everything from email and may not think to "confirm" an experience happened.

### Cancellation economics

| Scenario | Guest refund | Supplier payment |
|----------|-------------|-----------------|
| Guest cancels within policy window | Full refund | Nothing |
| Guest cancels outside policy window | No refund | Full payment |
| Supplier cancels | Full refund | Nothing |

Provider-initiated cancellations always result in a full guest refund. This is industry standard and not configurable.

### Commission is pre-calculated

At booking creation, `supplier_amount_cents` is calculated and stored. The settlement process is channel-agnostic — it just transfers the stored amount. No re-calculation at settlement time.

## References

- Booking flow: `docs/product/system/booking-flow.md`
- Pricing: `docs/product/system/pricing.md`
- Commission code: `apps/widget/src/lib/commission.ts`
- Cursor rule: `.cursor/rules/conventions.mdc` (Stripe intent; flow in `system/booking-flow.md`, settlement in this doc)
