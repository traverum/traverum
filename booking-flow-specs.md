# Traverum Booking Flow Specification

> **Document Purpose**: Define exactly what the system should do. Cursor handles implementation.
> **Last Updated**: January 2025

---

## System Overview

Traverum uses a **request-based booking flow**. Guests submit booking requests, suppliers approve or decline via email, guests pay via Stripe, and funds are transferred after the experience is confirmed complete.

**Key principle**: Suppliers manage everything via email. No dashboard required.

---

## The Complete Flow

### Phase 1: Guest Submits Request

1. Guest visits hotel's embedded widget
2. Guest selects: experience, date, time, number of participants
3. Guest enters: first name, last name, email, phone number
4. Guest clicks "Send Request"
5. System creates reservation with status `pending`
6. System sets `response_deadline` to 48 hours from now
7. System sends email to supplier: "New booking request" with Accept and Decline buttons
8. System sends email to guest: "Request received, awaiting confirmation"

### Phase 2: Supplier Responds

**If supplier clicks "Accept":**
1. System updates reservation status to `approved`
2. System sets `payment_deadline` to 24 hours from now
3. System creates Stripe Payment Link for the total amount
4. System stores the payment link URL on the reservation
5. System sends email to guest: "Booking approved!" with payment button/link

**If supplier clicks "Decline":**
1. System updates reservation status to `declined`
2. System sends email to guest: "Unfortunately this time is not available"
3. Flow ends (guest can submit a new request with different time if they want)

**If supplier does not respond within 48 hours:**
1. Cron job detects `response_deadline` has passed
2. System updates reservation status to `expired`
3. System sends email to guest: "Request expired - provider did not respond"

### Phase 3: Guest Pays

**If guest completes payment:**
1. Stripe sends webhook `payment_intent.succeeded`
2. System creates booking record with status `confirmed`
3. System stores `stripe_charge_id` for later refund/transfer operations
4. System calculates and stores the three-way split amounts:
   - Supplier amount (80%)
   - Hotel amount (12%)
   - Platform amount (8%)
5. System sends email to supplier: "Payment received! Booking confirmed" with guest details
6. System sends email to guest: "Payment successful!" with:
   - Booking confirmation details
   - Experience information (date, time, meeting point)
   - Cancel link (only works if 7+ days before experience)

**If guest does not pay within 24 hours:**
1. Cron job detects `payment_deadline` has passed and no booking exists
2. System updates reservation status to `expired`
3. System releases any held spots on the session
4. System sends email to guest: "Payment window has closed"
5. System sends email to supplier: "Guest did not complete payment"

### Phase 4: Guest Cancellation (Optional)

**If guest clicks cancel link 7 or more days before experience:**
1. System verifies cancellation is allowed (7+ days before)
2. System updates booking status to `cancelled`
3. System initiates full refund via Stripe
4. System sends email to guest: "Cancellation confirmed, refund processing"
5. System sends email to supplier: "Guest has cancelled their booking"
6. System releases the spots on the session

**If guest tries to cancel less than 7 days before:**
1. Cancel link shows message: "Cancellation is no longer available for this booking"
2. No action taken - guest is committed to pay

**Note**: If supplier needs to cancel (weather, illness, etc.), they contact the guest directly using the guest's phone/email. They then use the post-experience confirmation to trigger the refund.

### Phase 5: Post-Experience Settlement

**Day after the experience date:**
1. Cron job identifies all confirmed bookings where session date was yesterday
2. System sends email to supplier: "Did this experience happen?" with Yes and No buttons

**If supplier clicks "Yes, it happened":**
1. System updates booking status to `completed`
2. System creates Stripe transfer to supplier's connected account for their 80%
3. System records hotel commission (12%) in database for monthly batch payout
4. System sends email to supplier: "Payment has been transferred to your account"
5. Optionally: System sends email to hotel: "Your widget earned commission on a booking"

**If supplier clicks "No, it did not happen":**
1. System updates booking status to `cancelled`
2. System initiates full refund to guest via Stripe
3. System sends email to guest: "Your booking has been refunded"
4. No commission recorded for hotel
5. No transfer to supplier

**If supplier does not respond within 7 days:**
1. Cron job auto-marks booking as `completed`
2. System proceeds with transfers as if supplier clicked "Yes"
3. Rationale: Assume experience happened if no complaint from either party

---

## Business Rules

### Timing Rules

| Rule | Value | Notes |
|------|-------|-------|
| Supplier response deadline | 48 hours | From request submission |
| Guest payment deadline | 24 hours | From supplier acceptance |
| Guest cancellation window | 7+ days before | Free cancellation allowed |
| Completion check email | Day after experience | Sent morning after |
| Auto-complete if no response | 7 days after experience | Assumes it happened |

### Cancellation Policy

| Who | When | Result |
|-----|------|--------|
| Guest | 7+ days before | Full refund, spots released |
| Guest | Less than 7 days | Cannot cancel, must pay |
| Guest | No-show | No refund, supplier paid |
| Supplier | Any time | Contacts guest directly, then reports "did not happen" to trigger refund |

### Revenue Split

| Party | Percentage | Payment Method |
|-------|------------|----------------|
| Supplier | 80% | Stripe Connect transfer after completion |
| Hotel | 12% | Recorded in database, monthly batch payout |
| Platform | 8% | Remains in Traverum Stripe account |

---

## Database States

### Reservation Statuses

| Status | Meaning | How it gets here |
|--------|---------|------------------|
| `pending` | Waiting for supplier to respond | Created when guest submits request |
| `approved` | Supplier accepted, waiting for payment | Supplier clicked Accept |
| `declined` | Supplier rejected the request | Supplier clicked Decline |
| `expired` | Timeout occurred | 48h passed (no response) or 24h passed (no payment) |

### Booking Statuses

| Status | Meaning | How it gets here |
|--------|---------|------------------|
| `confirmed` | Paid, experience upcoming | Payment succeeded |
| `completed` | Done, funds transferred | Supplier confirmed or auto-completed |
| `cancelled` | Cancelled, refunded | Guest cancelled or supplier reported no-experience |

### State Transitions

```
RESERVATION:
pending â†’ approved (supplier accepts)
pending â†’ declined (supplier declines)
pending â†’ expired (48h timeout)
approved â†’ expired (24h timeout, no payment)
approved â†’ [booking created] (payment succeeds)

BOOKING:
confirmed â†’ completed (supplier confirms or 7-day auto-complete)
confirmed â†’ cancelled (guest cancels or supplier reports no-experience)
```

---

## Emails to Implement

### Request Phase

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `supplier_new_request` | Supplier | Request created | Guest name, date, time, participants, Accept button, Decline button |
| `guest_request_received` | Guest | Request created | Experience name, date, time, "waiting for confirmation" message |

### Decision Phase

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `guest_booking_approved` | Guest | Supplier accepts | Experience details, date, time, meeting point, **Pay Now button** |
| `guest_request_declined` | Guest | Supplier declines | Apology message, suggestion to try different time |
| `guest_request_expired` | Guest | 48h timeout | "Provider did not respond" message |

### Payment Phase

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `supplier_booking_confirmed` | Supplier | Payment succeeds | Guest name, email, phone, date, time, participant count |
| `guest_payment_confirmed` | Guest | Payment succeeds | Confirmation number, full details, what to bring, **Cancel link** |
| `guest_payment_expired` | Guest | 24h timeout | "Payment window closed" message |
| `supplier_payment_not_completed` | Supplier | 24h timeout | "Guest did not pay" notification |

### Cancellation Phase

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `guest_cancellation_confirmed` | Guest | Guest cancels | Confirmation of cancellation, refund info |
| `supplier_guest_cancelled` | Supplier | Guest cancels | Which booking was cancelled, date/time that freed up |

### Settlement Phase

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `supplier_completion_check` | Supplier | Day after experience | **Yes button**, **No button**, booking details for reference |
| `supplier_payout_sent` | Supplier | Completion confirmed | Amount transferred, booking reference |
| `guest_refund_processed` | Guest | No-experience reported | Refund amount, processing time |
| `hotel_commission_earned` | Hotel | Completion confirmed | Commission amount, which experience, "paid end of month" note (optional) |

---

## Email Action Links

All action links must be:
- **Signed with a secret token** (prevent URL guessing)
- **Expiring** (tokens should have reasonable TTL)
- **One-click** (no login required)
- **Idempotent** (clicking twice doesn't break anything)

| Action | Link Format | Token Expiry |
|--------|-------------|--------------|
| Accept request | `/api/reservations/:id/accept?token=xxx` | 48 hours |
| Decline request | `/api/reservations/:id/decline?token=xxx` | 48 hours |
| Cancel booking | `/api/bookings/:id/cancel?token=xxx` | Until 7 days before experience |
| Confirm completion | `/api/bookings/:id/complete?token=xxx` | 14 days |
| Report no-experience | `/api/bookings/:id/no-experience?token=xxx` | 14 days |

---

## Cron Jobs to Implement

| Job Name | Schedule | What it does |
|----------|----------|--------------|
| `expire-pending-reservations` | Every hour | Find `pending` reservations where `response_deadline < now`, set to `expired`, email guest |
| `expire-unpaid-reservations` | Every 15 minutes | Find `approved` reservations where `payment_deadline < now` and no booking exists, set to `expired`, release spots, email both parties |
| `send-completion-checks` | Daily at 10:00 | Find `confirmed` bookings where session date was yesterday, email supplier completion check |
| `auto-complete-bookings` | Daily at 02:00 | Find `confirmed` bookings where session date was 7+ days ago and no completion response, auto-complete and trigger transfers |

---

## Stripe Operations

### When Supplier Accepts
- Create Payment Link with reservation metadata
- Store payment link URL on reservation record

### When Payment Succeeds (Webhook)
- Extract reservation ID from payment intent metadata
- Create booking record with charge ID stored
- Calculate split amounts based on distribution table

### When Completion Confirmed
- Create Transfer to supplier's connected Stripe account
- Amount: `supplier_amount_cents` from booking record
- Store transfer ID on booking record

### When Refund Needed
- Create Refund using stored charge ID
- Full amount refund
- Store refund ID on booking record

---

## Edge Cases to Handle

| Situation | How to Handle |
|-----------|---------------|
| Supplier clicks Accept twice | Second click shows "Already accepted" message |
| Supplier clicks Decline after Accept | Not allowed, show "Booking already approved" |
| Guest clicks pay link after expiry | Payment link should be deactivated, show error |
| Guest clicks cancel after 7-day window | Show "Cancellation no longer available" |
| Stripe webhook arrives before redirect | Handle gracefully, booking might already exist |
| Supplier has no Stripe account yet | Block accept action, prompt to complete Stripe onboarding |
| Experience session is full | Reject request at submission time |
| Double payment attempt | Stripe handles this, only one charge goes through |

---

## Data to Store

### On Reservation Creation
- Experience ID, Session ID, Hotel ID
- Guest name, email, phone
- Number of participants
- Total price in cents
- Response deadline timestamp
- Status: `pending`

### On Supplier Accept
- Payment deadline timestamp
- Stripe payment link ID and URL
- Status: `approved`

### On Payment Success
- Create booking record with:
  - Stripe payment intent ID
  - Stripe charge ID
  - Total amount, supplier amount, hotel amount, platform amount
  - Paid at timestamp
  - Status: `confirmed`

### On Completion
- Completion confirmed at timestamp
- Stripe transfer ID
- Status: `completed`

---

## Success Metrics to Track

| Metric | How to Calculate |
|--------|------------------|
| Request conversion rate | Bookings created / Requests submitted |
| Supplier response rate | (Accepted + Declined) / Total requests |
| Payment completion rate | Bookings / Approved reservations |
| Average response time | Time between request and supplier action |
| Cancellation rate | Cancelled bookings / Total bookings |
| Hotel revenue | Sum of hotel_amount_cents for completed bookings per hotel |

---

## Summary

This is a **4-phase flow**:

1. **Request** â†’ Guest submits, supplier gets email
2. **Decision** â†’ Supplier accepts or declines via email
3. **Payment** â†’ Guest pays via Stripe link
4. **Settlement** â†’ Supplier confirms completion, funds transfer

Everything happens via email links. No dashboards required for MVP.

The system is designed to be **self-correcting**: timeouts auto-expire stale requests, auto-completion ensures funds don't get stuck, and refunds happen automatically when needed.