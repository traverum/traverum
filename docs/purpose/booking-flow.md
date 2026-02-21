# Booking Flow

## Purpose

The booking flow is the core product. Everything else exists to support it.

**For the guest:** Booking should feel effortless. Pick an experience, choose a time, enter details, pay. Done. If no session exists, request a time and get a response within 48 hours. The guest should always know what's happening — clear status, clear next steps.

**For the supplier:** Never miss a booking. Get notified by email with one-click Accept/Decline — no dashboard login required. Get paid after the experience happens. If something goes wrong, the system handles refunds and cancellations fairly.

**For the hotel:** Invisible. The hotel doesn't participate in the booking flow at all. They earn commission automatically.

**What should never happen:**
- A guest pays but the supplier doesn't know about it
- A supplier sees guest contact info before payment (prevents platform bypass)
- Money gets stuck — every paid booking must eventually settle
- A booking expires silently without anyone being notified

## Key decisions

### Two flows, one outcome

1. **Session-based (instant):** Guest picks an existing time slot → pays immediately → booking confirmed. No supplier approval needed. Fast path.
2. **Request-based (approval):** Guest requests a custom date/time → supplier accepts or declines → guest pays → booking confirmed. Slower but flexible.
3. **Rental (variant of request):** Per-day pricing, quantity-based (e.g., 2 Vespas for 3 days). Always request-based. No session inventory — supplier manages availability manually.

### Status machines — never transition backwards

- **Reservation:** `pending` → `approved` | `declined` | `expired`
- **Booking:** `confirmed` → `completed` | `cancelled`
- **Session:** `available` → `booked` | `cancelled`

### Timing windows

| Window | Duration | Purpose |
|--------|----------|---------|
| Supplier response | 48 hours | Prevents requests sitting forever |
| Guest payment | 24 hours | Prevents approved bookings going stale |
| Guest cancellation | Per policy (see below) | Fair, configurable cancellation |
| Completion check | 1 day after experience | Supplier confirms delivery |
| Auto-complete | 7 days after experience | Ensures supplier gets paid even if they forget |

### Privacy rule

Guest contact info (email, phone) is hidden from the supplier until payment is confirmed. This protects the platform from being bypassed — once the guest has paid through Traverum, revealing contact info is safe.

### Commission split

Every payment splits three ways: supplier + hotel + platform = 100%. Default: 80/12/8. Configurable per experience-hotel pair. Rounding remainder goes to platform. Settlement happens after supplier confirms the experience happened (or auto-completes).

### Cancellation policies

Each experience has a configurable cancellation policy:

| Policy | Window | Description |
|--------|--------|-------------|
| Flexible | 24 hours before | Free cancellation up to 1 day before |
| Moderate (default) | 7 days before | Free cancellation up to 7 days before |
| Strict | No refund | No refunds after booking is confirmed |
| Non-refundable | No refund | No refunds for guest cancellations |

Optionally, experiences can enable "force majeure refund" — full refund if supplier cancels due to weather or emergency.

### One group per session

When a guest books a session, it's exclusively theirs. No shared sessions, no capacity pools. `max_participants` is a group size cap, not a shared-spots count.

### Supplier response channels

Suppliers can respond via:
1. **Email one-click links** (signed HMAC tokens, expiring)
2. **Dedicated respond page** (Accept/Decline buttons)
3. **Dashboard** (authenticated, no tokens needed)

The email path is primary — suppliers shouldn't need to log in for basic operations.

## Reference

- Full spec (512 lines): `docs/technical/booking-flow-specs.md`
- Cursor rule: `.cursor/rules/booking-data-model.mdc`
- Glossary: `docs/technical/glossary.md`
- Code: `apps/widget/src/app/api/reservations/`
