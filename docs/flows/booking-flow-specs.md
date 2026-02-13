# Booking Flow Specification

## What & Why

**WHAT:** Two booking flows. Session-based (instant) and request-based (approval required).

**WHY:** Hotels sell experiences to guests via widget. Suppliers manage everything via email + dashboard. No dashboard required for core flows (accept/decline via email one-click).

**Key principles:**
- Supplier never sees guest email until after payment. All communication mediated via Traverum email system with signed action tokens.
- One group per session. When a guest books a session, it's theirs — no other parties join.
- `max_participants` is a group-size cap, not a shared-spots pool.

---

## Flow A: Session-Based Booking (Instant)

Guest picks an existing session. No supplier approval needed. Pay immediately.

**Steps:**

1. Guest selects experience + session + participants in widget
2. Guest enters name, email, phone on checkout page
3. System validates session is `available` and participants <= `max_participants`
4. System sets session status to `booked` (no longer visible in widget)
5. System creates reservation with status `approved`
6. System creates Stripe Payment Link and redirects guest to pay
7. Email to supplier: "New booking" (FYI only)

Then continues to [Payment Phase](#payment-phase).

---

## Flow B: Request-Based Booking (Approval Required)

Guest requests custom date/time. Supplier must respond.

### Phase 1: Guest Submits Request

1. Guest selects experience + custom date/time + participants
2. Guest enters name, email, phone
3. System creates reservation with status `pending`
4. System sets `response_deadline` = now + 48h
5. Email to supplier: "New booking request" with **Accept** and **Decline** buttons (links to respond page or direct API)
6. Email to guest: "Request received, awaiting confirmation"

### Phase 2: Supplier Responds

**Accept:**
- Create a private session for requested date/time (visible in supplier calendar only, **not** in widget)
- Session created with status `booked` (already claimed by this guest)
- Link reservation to session (`session_id`)
- Status → `approved`, set `payment_deadline` = now + 24h
- Create Stripe Payment Link
- Email to guest: "Booking approved!" with Pay Now button

**Decline:**
- Status → `declined`
- Supplier can include an optional message (e.g. suggesting alternatives)
- Email to guest: "This time is not available" with supplier's message (if any) and link to view available sessions

**No response within 48h:**
- Cron sets status → `expired`
- Email to guest: "Request expired - provider did not respond"

### Supplier Response Channels

Suppliers can accept/decline via three entry points:
1. **Email one-click links:** `GET /api/reservations/:id/accept?token=xxx` or `/decline?token=xxx`
2. **Respond page:** `/request/:id/respond?at=acceptToken&dt=declineToken` — a dedicated page with Accept/Decline buttons
3. **Dashboard:** `POST /api/dashboard/requests/:id/accept` or `/decline` — authenticated via Supabase JWT, no token needed

---

## Flow C: Propose New Time (NOT YET IMPLEMENTED)

> **Status:** Planned but not built. The spec is retained here for future reference. Currently, the closest behavior is the supplier's ability to include a message when declining (suggesting alternatives informally).

Supplier counter-proposes 1-3 alternative time slots instead of accepting or declining. Guest picks one or declines all. One round only — if guest declines, reservation is declined.

**Dashboard-only action.** Proposing requires a form with date/time pickers which doesn't work in email. Supplier email includes a "Propose a different time" link to the dashboard.

### Supplier Proposes (Dashboard)

1. Supplier clicks "Propose New Time" on pending request card in Booking Management page
2. Inline form opens: 1-3 date/time slots (date picker + time picker)
3. Dashboard updates Supabase directly (authenticated via Supabase auth, no token needed):
   - Stores slots in `proposed_times` JSONB on reservation
   - Status → `proposed`, `response_deadline` reset to now + 48h
4. Dashboard triggers email to guest via server function
5. Guest receives email listing all proposed slots with **Select** buttons + **"None of these work"** button

### Guest Responds

**Selects a slot:**
- System reads `proposed_times[slot]` for the chosen date/time
- Create private session (same logic as Accept — not visible in widget)
- Status → `approved`, create payment link, set `payment_deadline` = now + 24h
- Email to guest: Pay Now
- Email to supplier: "Guest accepted your proposed time"

**Declines all:**
- Status → `declined`
- Email to supplier: "Guest declined all proposed times"

**No response within 48h:**
- Cron sets status → `expired`

---

## Payment Phase

Shared by all flows after reservation reaches `approved` status.

**Guest pays:**
1. Guest clicks Stripe Payment Link → pays on Stripe hosted checkout
2. Stripe webhook `payment_intent.succeeded` (or `checkout.session.completed` as fallback)
3. System creates booking with status `confirmed`
4. Stores `stripe_payment_intent_id`, `stripe_charge_id`
5. Calculates split using `distributions` table (see [Revenue Split](#revenue-split))
6. Email to supplier: "Payment received!" with guest name, email, phone
7. Email to guest: "Payment successful!" with booking details, supplier contact info, cancel link

**Guest doesn't pay within 24h:**
- Status → `expired`, session status → `available` (session-based) or session deleted (request-based private session)
- Email to guest: "Payment window closed"
- Email to supplier: "Guest did not pay"

**Payment fails (Stripe `payment_intent.payment_failed`):**
- Session status → `available` (session-based) or session deleted (request-based)
- Email to guest: "Payment failed"

**Idempotency:** Check if booking already exists before creating (prevents webhook duplicates).

**Manual booking recovery:** If webhook fails, `POST /api/bookings/manual-create` can recreate the booking from a `paymentIntentId` or `reservationId`. Protected by `CRON_SECRET`.

---

## Guest Cancellation

**7+ days before experience:** Full refund, session status → `available` (or private session deleted), both parties emailed
**Less than 7 days:** Cancel link shows "Cancellation no longer available"

If supplier needs to cancel: contacts guest directly (has email after payment), then uses post-experience confirmation to trigger refund.

---

## Post-Experience Settlement

**Day after experience** — cron sends supplier email: "Did this experience happen?"

**"Yes, it happened":**
- Status → `completed`
- Stripe transfer to supplier (`supplier_amount_cents`) using `source_transaction` (charge ID)
- Record hotel commission
- Email supplier: "Payment transferred"

**"No - Refund required"** (supplier fault: weather, illness):
- Status → `cancelled`
- Full refund to guest
- No payout to supplier, no hotel commission
- Session status → `available` (or private session deleted)

**"No - No refund"** (guest fault: no-show):
- Status → `completed` (supplier still gets paid)
- `refund_reason` = 'no-show'
- Normal payout (transfer + hotel commission)
- No refund to guest

**No response within 7 days:**
- Auto-complete, proceed with payout (assume it happened)

---

## Business Rules

### Timing

| Rule | Value |
|------|-------|
| Supplier response deadline | 48h from request |
| Guest payment deadline | 24h from approval |
| Guest cancellation window | 7+ days before experience |
| Completion check email | Day after experience |
| Auto-complete if no response | 7 days after experience |

### Revenue Split

Commissions are **configurable per experience-hotel pair** via the `distributions` table.

| Party | Default % | Self-Owned % | Method |
|-------|-----------|--------------|--------|
| Supplier | 80% | 92% | Stripe Connect transfer after completion |
| Hotel | 12% | 0% | DB record, monthly batch payout |
| Platform | 8% | 8% | Remains in Traverum Stripe account |

- "Self-owned" = hotel is also the experience supplier (no separate hotel commission).
- Rounding remainder goes to platform.
- Rates stored in `distributions` table as whole numbers (e.g. `commission_supplier = 80` for 80%).
- Split calculated by `calculateCommissionSplit()` in `lib/commission.ts`.

### Cancellation Policy

| Who | When | Result |
|-----|------|--------|
| Guest | 7+ days before | Full refund, session released |
| Guest | Less than 7 days | Cannot cancel |
| Guest | No-show | No refund, supplier paid |
| Supplier | Any time (weather, illness) | Full refund, no payout |

---

## Database States

### Reservation Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Request-based: waiting for supplier response |
| `approved` | Accepted, waiting for payment |
| `declined` | Supplier or guest rejected |
| `expired` | Timeout (48h no response, 24h no payment) |

### Booking Statuses

| Status | Meaning |
|--------|---------|
| `confirmed` | Paid, experience upcoming |
| `completed` | Done, funds transferred |
| `cancelled` | Cancelled and/or refunded |

### Session Statuses

| Status | Meaning |
|--------|---------|
| `available` | Open for booking in widget |
| `booked` | Claimed by a guest (one group) |
| `cancelled` | Cancelled by supplier |

### State Transitions

```
RESERVATION (Session-Based):
[created as approved] → expired (24h no payment)
[created as approved] → [booking created] (payment)

RESERVATION (Request-Based):
pending → approved (supplier accepts)
pending → declined (supplier declines)
pending → expired (48h timeout)
approved → expired (24h no payment)
approved → [booking created] (payment)

SESSION:
available → booked (guest books or request accepted)
booked → available (cancellation, payment failure, expiry)
available → cancelled (supplier cancels)

BOOKING:
confirmed → completed (supplier confirms or 7-day auto-complete)
confirmed → cancelled (guest cancels or supplier reports no-experience)
```

---

## Email Templates

### Session-Based

| Template | To | When |
|----------|----|------|
| `guestInstantBooking` | Guest | Session booked — Pay Now button, deadline |
| `supplierNewBooking` | Supplier | Session booked — guest details, "payment pending" |

### Request-Based

| Template | To | When |
|----------|----|------|
| `supplierNewRequest` | Supplier | Request created — **Accept**, **Decline** buttons |
| `guestBookingApproved` | Guest | Approved — Pay Now button |
| `guestRequestDeclined` | Guest | Declined — supplier message (if any) + link to available sessions |

### Payment Phase

| Template | To | When |
|----------|----|------|
| `supplierBookingConfirmed` | Supplier | Paid — guest name, email, phone |
| `guestPaymentConfirmed` | Guest | Paid — confirmation, supplier contact, cancel link |
| `guestPaymentFailed` | Guest | Payment failed (Stripe) |
| Inline: "Payment Window Closed" | Guest | 24h timeout |
| Inline: "Payment Not Completed" | Supplier | 24h timeout |

### Request Expiry

| Template | To | When |
|----------|----|------|
| Inline: "Request Expired" | Guest | 48h timeout |

### Cancellation

| Template | To | When |
|----------|----|------|
| `guestRefundProcessed` | Guest | Cancelled — refund info |
| (via Stripe `charge.refunded` webhook) | | |

### Settlement

| Template | To | When |
|----------|----|------|
| `supplierCompletionCheck` | Supplier | Day after — **Yes**, **No-Refund**, **No-NoRefund** buttons |
| `supplierPayoutSent` | Supplier | Completed — amount, reference |

### Admin

| Template | To | When |
|----------|----|------|
| `adminAccountStatusChanged` | Admin | Stripe Connect account status change |

---

## Email Action Links

All links: signed HMAC token, expiring, one-click, idempotent.

| Action | Endpoint | Expiry |
|--------|----------|--------|
| Accept request | `GET /api/reservations/:id/accept?token=xxx` | 48h |
| Decline request | `GET /api/reservations/:id/decline?token=xxx` | 48h |
| Respond page (accept/decline) | `/request/:id/respond?at=acceptToken&dt=declineToken` | 48h |
| Cancel booking | `GET /api/bookings/:id/cancel?token=xxx` | Until 7 days before |
| Confirm completion | `GET /api/bookings/:id/complete?token=xxx` | 14 days |
| No-experience (refund) | `GET /api/bookings/:id/no-experience?token=xxx` | 14 days |

**Dashboard routes (JWT auth, no token):**

| Action | Endpoint |
|--------|----------|
| Accept request | `POST /api/dashboard/requests/:id/accept` |
| Decline request | `POST /api/dashboard/requests/:id/decline` |

---

## Cron Jobs

| Job | Route | Schedule | What |
|-----|-------|----------|------|
| Expire reservations | `/api/cron/expire-reservations` | Hourly | (1) `pending` where `response_deadline < now` → `expired`, email guest; (2) `approved` where `payment_deadline < now` and no booking → `expired`, session → `available`, email both |
| Expire unpaid | `/api/cron/expire-unpaid` | Every 15 min | `approved` where `payment_deadline < now` and no booking → `expired`, session → `available`, email guest |
| Completion check | `/api/cron/completion-check` | Daily | `confirmed` bookings where session was yesterday → email supplier with completion check links |
| Auto-complete | `/api/cron/auto-complete` | Daily | `confirmed` bookings 7+ days past session → auto-complete, transfer to supplier, email supplier |

---

## Stripe Operations

**Session-based booking:** Validate session `available` → session status `booked` → reservation `approved` → create Stripe Price + Payment Link → store URL → redirect guest

**Request accepted:** Create private session (status `booked`) → reservation `approved` → Payment Link → email guest

**Payment webhook (`payment_intent.succeeded` / `checkout.session.completed`):** Create booking with charge ID → calculate split from `distributions` → idempotency check

**Payment failed (`payment_intent.payment_failed`):** Session → `available` → email guest

**Completion confirmed:** Transfer to supplier using `source_transaction` (charge ID) → store transfer ID → record hotel commission → email supplier

**Transfer created (`transfer.created`):** Record transfer ID → email supplier

**Refund needed (`charge.refunded`):** Mark booking cancelled → session → `available` → email guest

**No-show (no refund):** Status `completed` → normal payout → `refund_reason = 'no-show'`

**Account updated (`account.updated`):** Update supplier Stripe onboarding status in `partners` table → email admin

**Manual recovery:** `POST /api/bookings/manual-create` with `paymentIntentId` or `reservationId` → recreate booking if webhook was missed

---

## Edge Cases

| Situation | Handling |
|-----------|----------|
| Supplier clicks Accept twice | "Already accepted" message |
| Decline after Accept | Blocked, "Already approved" |
| Pay link after expiry | Deactivated, show error |
| Cancel after 7-day window | "No longer available" |
| Webhook before redirect | Handle gracefully, booking may exist |
| No Stripe account | Block accept, prompt onboarding |
| Session already booked | Reject at submission, "Session no longer available" |
| Double payment | Stripe handles, one charge only |
| Webhook failure | Manual recovery via `/api/bookings/manual-create` |
| Participants > max_participants | Rejected at submission |

---

## Data Stored

**Reservation created (session-based):** experience_id, session_id, hotel_id, guest name/email/phone, participants, total_cents, payment_deadline, stripe_payment_link_id, stripe_payment_link_url, status `approved`

**Reservation created (request-based):** experience_id, hotel_id, guest name/email/phone, participants, total_cents, requested_date/time, response_deadline, is_request=true, status `pending`

**On accept:** session_id (created as private), payment_deadline, stripe_payment_link_id, stripe_payment_link_url, status `approved`

**On payment:** booking record with reservation_id, session_id, stripe_payment_intent_id, stripe_charge_id, supplier_amount_cents, hotel_amount_cents, platform_amount_cents, paid_at, status `confirmed`

**On completion:** completed_at, stripe_transfer_id, status `completed`, refund_reason null or 'no-show'

**On refund:** cancelled_at, stripe_refund_id, status `cancelled`, refund_reason

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `reservations` | Guest bookings before payment. Statuses: pending, approved, declined, expired |
| `bookings` | Paid bookings. Statuses: confirmed, completed, cancelled. Contains Stripe IDs and commission splits |
| `experience_sessions` | Time slots. Statuses: available, booked, cancelled. One group per session. |
| `experiences` | Experience config: max_participants, pricing, allows_requests |
| `distributions` | Per-experience-hotel commission rates (supplier/hotel/platform %) |
| `partners` | Suppliers with stripe_account_id and onboarding status |
| `hotel_configs` | Hotel slugs for widget URLs |

---

## Metrics

| Metric | Calculation |
|--------|-------------|
| Request conversion | Bookings / Requests |
| Supplier response rate | (Accepted + Declined) / Total requests |
| Payment completion | Bookings / Approved reservations |
| Avg response time | Time between request and supplier action |
| Cancellation rate | Cancelled / Total bookings |
| Hotel revenue | Sum hotel_amount_cents for completed bookings per hotel |
