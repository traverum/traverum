Updated by Elias on 07-02-2026

# Booking Flow Specification

## What & Why

**WHAT:** Two booking flows + a propose-new-time variant. Session-based (instant) and request-based (approval required).

**WHY:** Hotels sell experiences to guests via widget. Suppliers manage everything via email. No dashboard required for core flows.

**Key principle:** Supplier never sees guest email until after payment. All communication mediated via Traverum email system with signed action tokens. Propose New Time is dashboard-only (Accept/Decline remain email one-click).

---

## Flow A: Session-Based Booking (Instant)

Guest picks existing session with available spots. No approval needed.

**Steps:**
1. Guest selects experience + session + participants in widget
2. Guest enters name, email, phone
3. System deducts spots immediately
4. System creates reservation with status `approved` (skips pending)
5. System creates Stripe Checkout and takes the user to pay.

7. Email to supplier: "New booking pending payment" (FYI only)

Then continues to [Payment Phase](#payment-phase).

---

## Flow B: Request-Based Booking (Approval Required)

Guest requests custom date/time. Supplier must respond.

### Phase 1: Guest Submits Request

1. Guest selects experience + custom date/time + participants
2. Guest enters name, email, phone
3. System creates reservation with status `pending`
4. System sets `response_deadline` = now + 48h
5. Email to supplier: "New booking request" with **Accept** and **Decline** buttons + **"Propose a different time"** link to dashboard
6. Email to guest: "Request received, awaiting confirmation"

### Phase 2: Supplier Responds

**Accept:**
- Create or reuse session for requested date/time (new session becomes visible in widget for other guests)
- Link reservation to session (`session_id`)
- Status → `approved`, set `payment_deadline` = now + 24h
- Create Stripe Payment Link
- Email to guest: "Booking approved!" with Pay Now button

**Decline:**
- Status → `declined`
- Email to guest: "This time is not available"

**Propose New Time** (see [Flow C](#flow-c-propose-new-time)):
- Supplier picks 1-3 alternative time slots
- Status → `proposed`
- Email to guest with options to select or decline

**No response within 48h:**
- Cron sets status → `expired`
- Email to guest: "Request expired - provider did not respond"

---

## Flow C: Propose New Time

Supplier counter-proposes 1-3 alternative time slots instead of accepting or declining. Guest picks one or declines all. One round only -- if guest declines, reservation is declined.

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
- Create or reuse session (same logic as Accept)
- Status → `approved`, create payment link, set `payment_deadline` = now + 24h
- Email to guest: Pay Now
- Email to supplier: "Guest accepted your proposed time"

**Declines all:**
- Status → `declined`
- Email to supplier: "Guest declined all proposed times"

**No response within 48h:**
- Cron sets status → `expired` (same cron as pending requests, also checks `proposed` status)

---

## Payment Phase

Shared by all flows after reservation reaches `approved` status.

**Guest pays:**
1. Stripe webhook `checkout.session.completed`
2. System creates booking with status `confirmed`
3. Stores `stripe_payment_intent_id`, `stripe_charge_id`
4. Calculates split: supplier 80%, hotel 12%, platform 8%
5. Email to supplier: "Payment received!" with guest name, email, phone
6. Email to guest: "Payment successful!" with booking details, supplier contact info, cancel link

**Guest doesn't pay within 24h:**
- Status → `expired`, spots released
- Email to guest: "Payment window closed"
- Email to supplier: "Guest did not pay"

**Idempotency:** Check if booking already exists before creating (prevents webhook duplicates).

---

## Guest Cancellation

**7+ days before experience:** Full refund, spots released, both parties emailed
**Less than 7 days:** Cancel link shows "Cancellation no longer available"

If supplier needs to cancel: contacts guest directly (has email after payment), then uses post-experience confirmation to trigger refund.

---

## Post-Experience Settlement

**Day after experience** -- cron sends supplier email: "Did this experience happen?"

**"Yes, it happened":**
- Status → `completed`
- Stripe transfer to supplier (80%) using `source_transaction` (charge ID)
- Record hotel commission (12%)
- Email supplier: "Payment transferred"

**"No - Refund required"** (supplier fault: weather, illness):
- Status → `cancelled`
- Full refund to guest
- No payout to supplier, no hotel commission
- Release spots

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

| Party | % | Method |
|-------|---|--------|
| Supplier | 80% | Stripe Connect transfer after completion |
| Hotel | 12% | DB record, monthly batch payout |
| Platform | 8% | Remains in Traverum Stripe account |

### Cancellation Policy

| Who | When | Result |
|-----|------|--------|
| Guest | 7+ days before | Full refund, spots released |
| Guest | Less than 7 days | Cannot cancel |
| Guest | No-show | No refund, supplier paid |
| Supplier | Any time (weather, illness) | Full refund, no payout |

---

## Database States

### Reservation Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Waiting for supplier response |
| `proposed` | Supplier proposed new time(s), awaiting guest |
| `approved` | Accepted, waiting for payment |
| `declined` | Supplier or guest rejected |
| `expired` | Timeout (48h no response, 24h no payment) |

### Booking Statuses

| Status | Meaning |
|--------|---------|
| `confirmed` | Paid, experience upcoming |
| `completed` | Done, funds transferred |
| `cancelled` | Cancelled and/or refunded |

### State Transitions

```
RESERVATION (Session-Based):
[created as approved] → expired (24h no payment)
[created as approved] → [booking created] (payment)

RESERVATION (Request-Based):
pending → approved (supplier accepts)
pending → declined (supplier declines)
pending → proposed (supplier proposes new time)
pending → expired (48h timeout)
proposed → approved (guest selects a slot)
proposed → declined (guest declines all slots)
proposed → expired (48h timeout)
approved → expired (24h no payment)
approved → [booking created] (payment)

BOOKING:
confirmed → completed (supplier confirms or 7-day auto-complete)
confirmed → cancelled (guest cancels or supplier reports no-experience)
```

---

## Email Templates

### Session-Based

| Template | To | When |
|----------|----|------|
| `guest_instant_booking` | Guest | Session booked -- Pay Now button, deadline |
| `supplier_new_booking` | Supplier | Session booked -- guest details, "payment pending" |

### Request-Based

| Template | To | When |
|----------|----|------|
| `supplier_new_request` | Supplier | Request created -- **Accept**, **Decline** buttons + **"Propose a different time"** dashboard link |
| `guest_request_received` | Guest | Request created -- "waiting for confirmation" |

### Propose New Time

| Template | To | When |
|----------|----|------|
| `guest_time_proposed` | Guest | Supplier proposed 1-3 slots -- **Select** button per slot + **"None work"** |
| `supplier_proposed_accepted` | Supplier | Guest selected a slot -- "Payment pending" |
| `supplier_proposed_declined` | Supplier | Guest declined all slots |

### Decision Phase

| Template | To | When |
|----------|----|------|
| `guest_booking_approved` | Guest | Approved -- Pay Now button |
| `guest_request_declined` | Guest | Declined -- "try different time" |
| `guest_request_expired` | Guest | 48h timeout |

### Payment Phase

| Template | To | When |
|----------|----|------|
| `supplier_booking_confirmed` | Supplier | Paid -- guest name, email, phone |
| `guest_payment_confirmed` | Guest | Paid -- confirmation, supplier contact, cancel link |
| `guest_payment_expired` | Guest | 24h timeout |
| `supplier_payment_not_completed` | Supplier | 24h timeout |

### Cancellation

| Template | To | When |
|----------|----|------|
| `guest_cancellation_confirmed` | Guest | Cancelled -- refund info |
| `supplier_guest_cancelled` | Supplier | Cancelled -- freed date/time |

### Settlement

| Template | To | When |
|----------|----|------|
| `supplier_completion_check` | Supplier | Day after -- **Yes**, **No-Refund**, **No-NoRefund** buttons |
| `supplier_payout_sent` | Supplier | Completed -- amount, reference |
| `supplier_payout_sent_no_show` | Supplier | No-show -- amount, "no-show recorded" |
| `guest_refund_processed` | Guest | Refund -- amount, reason |
| `guest_no_show_notification` | Guest | No-show (optional) |
| `hotel_commission_earned` | Hotel | Completed (optional) -- commission amount |

---

## Email Action Links

All links: signed HMAC token, expiring, one-click, idempotent.

| Action | Endpoint | Expiry |
|--------|----------|--------|
| Accept request | `GET /api/reservations/:id/accept?token=xxx` | 48h |
| Decline request | `GET /api/reservations/:id/decline?token=xxx` | 48h |
| Propose new time | Dashboard only (`/supplier/bookings?request=<id>`) | n/a |
| Accept proposed slot | `GET /api/reservations/:id/accept-proposed?token=xxx&slot=N` | 48h |
| Decline proposed slots | `GET /api/reservations/:id/decline-proposed?token=xxx` | 48h |
| Cancel booking | `GET /api/bookings/:id/cancel?token=xxx` | Until 7 days before |
| Confirm completion | `GET /api/bookings/:id/complete?token=xxx` | 14 days |
| No-experience (refund) | `GET /api/bookings/:id/no-experience-refund?token=xxx` | 14 days |
| No-experience (no refund) | `GET /api/bookings/:id/no-experience-no-refund?token=xxx` | 14 days |

**Note on propose-time:** Supplier action is dashboard-only (no email token). Guest response uses signed tokens. `slot` param is an index into `proposed_times` JSONB array. Single token per proposal, slot not signed (guest can only choose among supplier-proposed times).

---

## Cron Jobs

| Job | Schedule | What |
|-----|----------|------|
| `expire-pending-reservations` | Every hour | `pending` or `proposed` where `response_deadline < now` → `expired`, email guest |
| `expire-unpaid-reservations` | Every 15 min | `approved` where `payment_deadline < now` and no booking → `expired`, release spots, email both |
| `send-completion-checks` | Daily 10:00 | `confirmed` bookings where session was yesterday → email supplier |
| `auto-complete-bookings` | Daily 02:00 | `confirmed` bookings 7+ days past session → auto-complete, trigger transfers |

---

## Stripe Operations

**Session-based booking:** Deduct spots → reservation `approved` → Payment Link → store URL

**Request accepted:** Create/reuse session → reservation `approved` → Payment Link → store URL

**Proposed time accepted:** Same as request accepted, using `proposed_times[slot]` date/time

**Payment webhook:** Create booking with charge ID → calculate split → idempotency check

**Completion confirmed:** Transfer to supplier using `source_transaction` (charge ID) → store transfer ID → record hotel commission

**Refund needed:** Refund via charge ID → store refund ID + reason

**No-show (no refund):** Status `completed` → normal payout → `refund_reason = 'no-show'`

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
| Session full | Reject at submission |
| Double payment | Stripe handles, one charge only |
| Multiple requests same time | Reuse existing session on accept |
| Propose time for non-pending | Blocked in dashboard, only works on `pending` status |
| Guest changes slot param | Acceptable -- can only choose from supplier-proposed times |

---

## Data Stored

**Reservation created (session-based):** experience_id, session_id, hotel_id, guest name/email/phone, participants, total_cents, payment_deadline, stripe payment link, status `approved`

**Reservation created (request-based):** experience_id, hotel_id, guest name/email/phone, participants, total_cents, requested_date/time, response_deadline, status `pending`

**On propose new time (dashboard):** `proposed_times` JSONB (1-3 slots), status `proposed`, response_deadline reset to 48h

**On accept/accept-proposed:** session_id (created/reused), payment_deadline, stripe payment link, status `approved`

**On payment:** booking record with session_id, stripe_payment_intent_id, stripe_charge_id, amount splits, paid_at, status `confirmed`

**On completion:** completed_at, stripe_transfer_id, status `completed`, refund_reason null or 'no-show'

**On refund:** cancelled_at, stripe_refund_id, status `cancelled`, refund_reason

---

## Metrics

| Metric | Calculation |
|--------|-------------|
| Request conversion | Bookings / Requests |
| Supplier response rate | (Accepted + Declined + Proposed) / Total requests |
| Proposal acceptance rate | Proposed-accepted / Total proposals |
| Payment completion | Bookings / Approved reservations |
| Avg response time | Time between request and supplier action |
| Cancellation rate | Cancelled / Total bookings |
| Hotel revenue | Sum hotel_amount_cents for completed bookings per hotel |
