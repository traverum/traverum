# Booking Flow

## Goal

The booking flow is the core product. Everything else exists to support it.

**For the guest:** Booking should feel effortless. Pick an experience, choose a time, enter details, done. The guest should always know what's happening — clear status, clear next steps.

**For the supplier:** Never miss a booking. Get notified by email with one-click Accept/Decline — no dashboard login required. Get paid fairly. If something goes wrong, the system handles cancellations and refunds.

**For the hotel:** Invisible. The hotel doesn't participate in the booking flow. They earn commission automatically.

**What should never happen:**
- A guest pays but the supplier doesn't know about it
- Money gets stuck — every paid booking must eventually settle
- A booking expires silently without anyone being notified
- The platform gets bypassed — commission must be protected

---

## Overview

The booking flow has two dimensions:

**Payment mode** — configured per supplier:
1. **Stripe (pay upfront)** — guest pays through the platform before the experience. Default.
2. **Reserve & Pay on Site** — guest provides a card guarantee, pays the supplier directly after the experience.

**Booking path** — determined by experience type:
1. **Session-based (instant)** — guest picks an existing time slot. No supplier approval needed.
2. **Request-based (approval)** — guest requests a custom date/time. Supplier accepts or declines.
3. **Rental** — per-day pricing, quantity-based (e.g., 2 Vespas for 3 days). Always request-based.

Any payment mode works with any booking path. The payment mode determines *how money moves*. The booking path determines *how the reservation is created*.

---

## Shared Rules

These apply to all flows regardless of payment mode or booking path.

### Status machines — never transition backwards

- **Reservation:** `pending` → `approved` | `declined` | `expired`
- **Booking:** `confirmed` → `completed` | `cancelled`
- **Session:** `available` → `booked` | `cancelled`

### Timing windows

| Window | Duration | Purpose |
|--------|----------|---------|
| Supplier response | 48 hours | Prevents requests sitting forever |
| Guest payment (Stripe mode) | 1 hour | Reduces slot blocking after approval |
| Guest cancellation | Per policy (see below) | Fair, configurable cancellation |
| Completion check | 1 day after experience | Supplier confirms delivery |
| Auto-complete | 7 days after experience | Ensures settlement even if supplier forgets |

### Cancellation policies

Each experience has a configurable cancellation policy:

| Policy | Window | Description |
|--------|--------|-------------|
| Flexible | 24 hours before | Free cancellation up to 1 day before |
| Moderate (default) | 7 days before | Free cancellation up to 7 days before |

Supplier-initiated cancellations (weather, illness, emergency) always result in a full guest refund. Industry standard, not configurable.

### Commission split

Commission depends on the booking channel (channel ≠ payment mode):

- **Hotel channel** (`reservation.hotel_id` is set): Three-way split from `distributions` table. Default: supplier 80% / hotel 12% / platform 8%. Configurable per experience-hotel pair. Rounding remainder goes to platform.
- **Direct channel** (`reservation.hotel_id` is null): Two-way split. Supplier 92% / platform 8%. Uses `SELF_OWNED_COMMISSION` from `@traverum/shared`.

Commission percentages are identical regardless of payment mode. Only the collection method differs.

### One group per session

When a guest books a session, it's exclusively theirs. No shared sessions, no capacity pools. `max_participants` is a group size cap, not a shared-spots count.

### Supplier response channels

Suppliers can respond to request-based bookings via:
1. **Email one-click links** (signed HMAC tokens, expiring) — primary path
2. **Dedicated respond page** (Accept/Decline buttons)
3. **Dashboard** (authenticated, no tokens needed)

The email path is primary — suppliers shouldn't need to log in for basic operations.

---

## Booking Path: Session-Based (Instant)

Guest picks an existing time slot. No supplier approval step.

| Step | Stripe mode | Reserve & Pay on Site mode |
|------|-------------|---------------------------|
| 1 | Guest selects session | Guest selects session |
| 2 | Guest enters details + pays via Stripe | Guest enters details + provides card guarantee |
| 3 | Booking confirmed immediately | Booking confirmed immediately |
| 4 | Guest attends experience | Guest attends, pays supplier on site |
| 5 | Supplier confirms completion | Supplier confirms completion |
| 6 | Settlement via Stripe Transfer | Commission invoiced monthly |

## Booking Path: Request-Based (Approval)

Guest requests a custom date/time. Supplier must approve before the booking is confirmed.

| Step | Stripe mode | Reserve & Pay on Site mode |
|------|-------------|---------------------------|
| 1 | Guest requests date/time | Guest requests date/time |
| 2 | Supplier accepts or declines (48h window) | Supplier accepts or declines (48h window) |
| 3 | If accepted → guest pays via Stripe (1h window) | If accepted → guest provides card guarantee |
| 4 | Booking confirmed after payment | Booking confirmed after guarantee |
| 5 | Guest attends experience | Guest attends, pays supplier on site |
| 6 | Supplier confirms completion | Supplier confirms completion |
| 7 | Settlement via Stripe Transfer | Commission invoiced monthly |

## Booking Path: Rental

Per-day pricing, quantity-based. Always follows the request-based path. No session inventory — supplier manages availability manually.

- Guest picks a start date + number of days + quantity (e.g., 2 Vespas for 3 days)
- Supplier accepts or declines manually
- Same payment mode logic as request-based above

---

## Payment Mode: Stripe (Pay Upfront)

The default payment mode. Guest pays the full experience price through Stripe before the experience happens.

### How money flows

1. Guest pays → money goes to Traverum's Stripe platform balance
2. Experience happens → supplier confirms completion (or auto-complete after 7 days)
3. Settlement cron transfers `supplier_amount_cents` to supplier's Stripe Connected Account
4. Commission stays in Traverum's balance (+ hotel share transferred if applicable)

### Privacy rule

Guest contact info (email, phone) is hidden from the supplier until payment is confirmed. Payment is the trust anchor — once the guest has paid through Traverum, revealing contact info is safe. This protects the platform from being bypassed.

### Cancellation economics

| Scenario | Guest refund | Supplier payment |
|----------|-------------|-----------------|
| Guest cancels within policy window | Full refund | Nothing |
| Guest cancels outside policy window | No refund | Full payment |
| Supplier cancels | Full refund | Nothing |

### Requirements

- Supplier must have an active Stripe Connected Account
- Supplier must complete Stripe Connect onboarding before receiving bookings

---

## Payment Mode: Reserve & Pay on Site

Guest reserves a spot without paying. They pay the supplier directly after the experience. Configured per supplier via `payment_mode = 'pay_on_site'`.

### Why this mode exists

Stripe Connect onboarding is friction for small experience providers. Many prefer to collect payment directly — cash, card terminal, bank transfer. Removing Stripe as a prerequisite dramatically lowers the barrier to getting suppliers on the platform. Traverum never holds the supplier's money, simplifying the relationship.

### How it works (happy path)

1. Guest browses and selects an experience
2. Guest enters details, provides card via **Stripe Setup Intent** (no charge, no hold — card saved for guarantee only), agrees to cancellation policy
3. Reservation created. Guest and supplier notified. Guest contact info revealed to supplier.
4. Guest attends the experience and pays the supplier directly on site
5. Supplier marks experience as "completed" (dashboard or email link)
6. Booking moves to `completed`. No money flows through Traverum.
7. 1st of each month: Traverum sends supplier a commission invoice. Supplier pays via bank transfer.

### Card guarantee

**Stripe Setup Intent** saves the guest's PaymentMethod to a Stripe Customer object. No charge, no hold, no authorization. The card stays on file until expiry or removal. If Traverum needs to charge a cancellation fee, it creates an off-session PaymentIntent using the saved PaymentMethod.

Why not a card hold (manual capture authorization)? Authorization holds expire in 5–7 days depending on card network. Guests book weeks in advance. The hold would expire long before the cancellation window matters. Setup Intent has no expiry.

The guest must explicitly agree to future charges at booking time. The cancellation policy checkbox is the legal agreement Stripe requires for off-session charges.

### Privacy rule

Guest contact info is revealed **after the card guarantee is set up**. The saved card replaces payment as the trust anchor — the guest has committed financial accountability through the cancellation policy agreement. The supplier needs contact info to coordinate the experience since there's no payment gate.

### Cancellation enforcement

| Scenario | What happens |
|----------|-------------|
| Guest cancels within policy window | Card is never charged. Nothing happens. |
| Guest cancels outside policy window | Guest's saved card is charged the full experience price. |
| Guest no-shows | Guest's saved card is charged the full experience price. |
| Supplier cancels | No charge to guest. No commission owed. |

When a cancellation fee is charged:
- Traverum charges the guest's card as a standard platform charge (no Stripe Connect involved)
- Money lands in Traverum's Stripe platform balance
- Same commission split applies (platform + hotel take their percentages)
- Supplier's share is credited on the monthly commission invoice (see invoice netting below)

### Attendance verification

To prevent suppliers from falsely claiming no-shows to skip commission:

1. Supplier marks guest as no-show
2. System sends guest a verification email: *"Did you attend [Experience] on [Date]?"*
   - Two options: **"Yes, I was there"** / **"No, I didn't attend"**
3. Guest has **3 days** to respond (reminder sent at day 2)
4. Outcomes:
   - Guest confirms attendance → override supplier claim → booking marked `completed` → commission applies
   - Guest confirms no-show → accept supplier claim → no commission
   - Guest doesn't respond → accept supplier claim → no commission
5. Every dispute is logged. Suppliers with repeated overrides are flagged for review.

### Monthly commission invoicing

Traverum doesn't handle the experience payment, so commission is collected via monthly invoice:

1. Cron job runs on the 1st of each month
2. Aggregates all `completed` bookings from the previous month where `payment_mode = 'pay_on_site'`
3. Calculates total commission owed (platform + hotel share)
4. Nets cancellation fee credits: supplier's share of any cancellation fees Traverum collected is subtracted from commission owed
5. Generates invoice, sends to supplier
6. Supplier pays the net amount via bank transfer

**Invoice netting example:**

```
Completed experiences (guest paid on-site):
  12 bookings, total guest revenue:          4.200,00 €
  Commission owed (platform + hotel):          516,00 €

Cancellation fees collected by Traverum:
  2 late cancellations charged:                380,00 €
  Supplier's share (credited):                -349,60 €

Net amount owed by supplier:                   166,40 €
```

### Requirements

- Supplier does NOT need a Stripe Connected Account
- Traverum needs a Stripe account for Setup Intents and off-session charges (already have this)
- Supplier must have bank details on file for invoice payment

---

## References

- Channels: `docs/product/system/channels.md`
- Pricing: `docs/product/system/pricing.md`
- Settlement (Stripe mode): `docs/product/supplier/get-paid.md`
- Code: `apps/widget/src/app/api/reservations/`
