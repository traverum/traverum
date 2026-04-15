---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/booking-flow.md
  - system/pricing.md
  - system/channels.md
tags: [booking, reservation, session, flow, status]
---

# Booking

The booking flow is the core product. Everything else exists to support it.

## Two dimensions

**[[payment-modes|Payment mode]]** (per supplier):
1. **Stripe (pay upfront)** — guest pays through the platform before the experience.
2. **Reserve & Pay on Site** — guest provides card guarantee, pays supplier directly after.

**Booking path** (per experience type):
1. **Session-based (instant)** — guest picks an existing time slot. No approval needed.
2. **Request-based (approval)** — guest requests a custom date/time. Supplier accepts or declines.
3. **Rental** — per-day [[pricing]], quantity-based. Always request-based.

Any payment mode works with any booking path.

## Status machines — never transition backwards

| Object | Statuses |
|--------|----------|
| Reservation | `pending` → `approved` \| `declined` \| `expired` |
| Booking | `confirmed` → `completed` \| `cancelled` |
| Session | `available` → `booked` \| `cancelled` |

## Timing windows

| Window | Duration | Purpose |
|--------|----------|---------|
| Supplier response | 48 hours | Prevents requests sitting forever |
| Guest payment (Stripe) | 1 hour | Reduces slot blocking after approval |
| Guest [[cancellation]] | Per policy | Fair, configurable cancellation |
| Completion check | 1 day after experience | Supplier confirms delivery |
| Auto-complete | 7 days after experience | Ensures settlement even if supplier forgets |

## Session-based flow (instant)

| Step | Stripe mode | Pay on Site mode |
|------|-------------|------------------|
| 1 | Guest selects session | Guest selects session |
| 2 | Guest enters details + pays via Stripe | Guest enters details + provides card guarantee |
| 3 | Booking confirmed immediately | Booking confirmed immediately |
| 4 | Guest attends | Guest attends, pays supplier on site |
| 5 | Supplier confirms completion | Supplier confirms completion |
| 6 | Settlement via Stripe Transfer | [[commission]] invoiced monthly |

## Request-based flow (approval)

| Step | Stripe mode | Pay on Site mode |
|------|-------------|------------------|
| 1 | Guest requests date/time | Guest requests date/time |
| 2 | Supplier accepts or declines (48h) | Supplier accepts or declines (48h) |
| 3 | Accepted → guest pays via Stripe (1h) | Accepted → guest provides card guarantee |
| 4 | Booking confirmed after payment | Booking confirmed after guarantee |
| 5 | Guest attends | Guest attends, pays supplier on site |
| 6 | Supplier confirms completion | Supplier confirms completion |
| 7 | Settlement via Stripe Transfer | [[commission]] invoiced monthly |

## Rental flow

Per-day [[pricing]], quantity-based (e.g. 2 Vespas for 3 days). Always follows the request-based path. No session inventory — supplier manages availability manually.

- `rental_end_date` is inclusive: start 1 April, 2 days → end date is 2 April
- Computed as `start + (days - 1)`, duration = `differenceInCalendarDays(end, start) + 1`
- Quantity stored in the `participants` field
- No session records created — date ranges match how rental businesses think

## One group per session

When a guest books a session, it's exclusively theirs. No shared sessions, no capacity pools. `max_participants` is a group size cap, not a shared-spots count.

## Supplier response channels

Suppliers respond to request-based bookings via:
1. **Email one-click links** (signed HMAC tokens, expiring) — primary path
2. **Dedicated respond page** (Accept/Decline buttons)
3. **Dashboard** (authenticated, no tokens needed)

Email is primary — suppliers shouldn't need to log in for basic operations.

## Booking reference format

Displayed as `TRV-XXXXXX` — first 8 characters of the booking UUID, uppercase. Short, unique enough for support, avoids exposing full UUID.

## Related pages

- [[payment-modes]] — How money moves (Stripe vs pay-on-site)
- [[commission]] — How revenue is split
- [[pricing]] — How prices are calculated
- [[cancellation]] — Policies and enforcement
- [[channels]] — Hotel widget vs Veyond direct
