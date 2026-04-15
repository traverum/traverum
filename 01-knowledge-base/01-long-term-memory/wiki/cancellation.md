---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/booking-flow.md
tags: [cancellation, refund, policy, no-show]
---

# Cancellation

Each experience has a configurable cancellation policy. Enforcement differs by [[payment-modes|payment mode]].

## Policies

| Policy | Window | Description |
|--------|--------|-------------|
| Flexible | 24 hours before | Free cancellation up to 1 day before |
| Moderate (default) | 7 days before | Free cancellation up to 7 days before |

Supplier-initiated cancellations (weather, illness, emergency) always result in a full guest refund. Industry standard, not configurable.

## Stripe mode enforcement

| Scenario | Guest refund | Supplier payment |
|----------|-------------|-----------------|
| Guest cancels within window | Full refund | Nothing |
| Guest cancels outside window | No refund | Full payment |
| Supplier cancels | Full refund | Nothing |

## Pay-on-site mode enforcement

| Scenario | What happens |
|----------|-------------|
| Guest cancels within window | Card never charged |
| Guest cancels outside window | Saved card charged full price |
| Guest no-shows | Saved card charged full price |
| Supplier cancels | No charge, no [[commission]] owed |

When a cancellation fee is charged:
- Traverum charges as a standard platform charge (no Stripe Connect)
- Same [[commission]] split applies
- Supplier's share credited on monthly invoice (see [[commission]] netting)

## No-show verification (pay-on-site only)

Prevents false no-show claims:
1. Supplier marks no-show
2. Guest emailed: "Did you attend [Experience] on [Date]?"
3. Guest has 3 days to respond (reminder at day 2)
4. Guest confirms attendance → override → [[booking]] marked `completed` → [[commission]] applies
5. Guest confirms no-show or silence → accept claim → no [[commission]]
6. Repeated overrides flagged for review

## Related pages

- [[booking]] — Status transitions and timing windows
- [[payment-modes]] — Determines enforcement mechanism
- [[commission]] — Cancellation fee netting on invoices
