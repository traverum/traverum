# Traverum Booking Flow Specification

> **Document Purpose**: Define exactly what the system should do. Cursor handles implementation.
> **Last Updated**: January 2025

---

## System Overview

Traverum supports **two booking flows** depending on whether the guest picks an existing session or requests a custom date/time:

1. **Session-Based Booking**: Guest picks an available session → Pays immediately (no approval needed)
2. **Request-Based Booking**: Guest requests a custom date/time → Supplier approves → Guest pays

**Key principle**: Suppliers manage everything via email. No dashboard required.

---

## Flow A: Session-Based Booking (Instant)

When a guest **selects an existing session** with available spots, they can pay immediately without waiting for supplier approval.

### Phase 1: Guest Selects Session

1. Guest visits hotel's embedded widget
2. Guest selects: experience, **existing session** (with date/time), number of participants
3. Guest enters: first name, last name, email, phone number
4. Guest clicks "Book Now"
5. System **deducts spots** from the session immediately
6. System creates reservation with status **`approved`** (skip pending)
7. System creates Stripe Payment Link immediately
8. System sets `payment_deadline` to 24 hours from now
9. System sends email to guest: **"Complete your booking!"** with Pay Now button
10. System sends email to supplier: **"New booking pending payment"** (notification only, no accept/decline)

### Phase 2: Guest Pays

Same as Request-Based Flow Phase 3 (below)

---

## Flow B: Request-Based Booking (Approval Required)

When a guest **requests a custom date/time** (not an existing session), the supplier must approve before the guest can pay.

### Phase 1: Guest Submits Request

1. Guest visits hotel's embedded widget
2. Guest selects: experience, **custom date/time** (via "Request Different Time")
3. Guest enters: first name, last name, email, phone number
4. Guest clicks "Send Request"
5. System creates reservation with status **`pending`**
6. System sets `response_deadline` to 48 hours from now
7. System sends email to supplier: **"New booking request"** with Accept and Decline buttons
8. System sends email to guest: **"Request received, awaiting confirmation"**

### Phase 2: Supplier Responds

**If supplier clicks "Accept":**
1. **Session is created for the requested date/time:**
   - System checks if a session already exists for that date/time
   - If session exists: Reuses it and deducts spots (spots_available -= participants)
   - If no session exists: Creates a new session with:
     - `session_date` = requested_date
     - `start_time` = requested_time
     - `spots_total` = experience.max_participants
     - `spots_available` = max_participants - reservation.participants
     - `session_status` = 'available'
   - System links reservation to the session (sets `session_id`)
   - **Business benefit**: The new session becomes visible in the widget, allowing other guests to book remaining spots
2. System updates reservation status to `approved`
3. System sets `payment_deadline` to 24 hours from now
4. System creates Stripe Payment Link for the total amount
5. System stores the payment link URL on the reservation
6. System sends email to guest: "Booking approved!" with payment button/link

**If supplier clicks "Decline":**
1. System updates reservation status to `declined`
2. System sends email to guest: "Unfortunately this time is not available"
3. Flow ends (guest can submit a new request with different time if they want)

**If supplier does not respond within 48 hours:**
1. Cron job detects `response_deadline` has passed
2. System updates reservation status to `expired`
3. System sends email to guest: "Request expired - provider did not respond"

### Phase 3: Guest Pays (Both Flows)

**If guest completes payment:**
1. Stripe sends webhook `payment_intent.succeeded` or `checkout.session.completed`
2. System extracts `reservationId` from payment intent metadata (or looks up via payment link)
3. System creates booking record with status `confirmed`:
   - **Requires `session_id`**: All bookings must have a session (sessions are auto-created on accept for request-based bookings)
   - Stores `stripe_payment_intent_id` and `stripe_charge_id` for later refund/transfer operations
   - Calculates and stores the three-way split amounts:
     - Supplier amount (80%)
     - Hotel amount (12%)
     - Platform amount (8%)
4. System sends email to supplier: "Payment received! Booking confirmed" with guest details
5. System sends email to guest: "Payment successful!" with:
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
2. System creates Stripe transfer to supplier's connected account for their 80%:
   - Retrieves charge ID from payment intent (if not stored)
   - Uses `source_transaction` parameter (charge ID) for transfers, especially important in test mode
   - This allows transfers even if platform balance is insufficient
3. System stores `stripe_transfer_id` on booking record
4. System records hotel commission (12%) in database for monthly batch payout
5. System sends email to supplier: "Payment has been transferred to your account"
6. Optionally: System sends email to hotel: "Your widget earned commission on a booking"

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
RESERVATION (Session-Based):
[created as approved] → expired (24h timeout, no payment)
[created as approved] → [booking created] (payment succeeds)

RESERVATION (Request-Based):
pending → approved (supplier accepts)
pending → declined (supplier declines)
pending → expired (48h timeout)
approved → expired (24h timeout, no payment)
approved → [booking created] (payment succeeds)

BOOKING:
confirmed → completed (supplier confirms or 7-day auto-complete)
confirmed → cancelled (guest cancels or supplier reports no-experience)
```

---

## Emails to Implement

### Session-Based Booking Emails

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `guest_instant_booking` | Guest | Session booked | Experience name, date, time, **Pay Now button**, payment deadline |
| `supplier_new_booking` | Supplier | Session booked | Guest details, date, time, participants, "Payment pending" note |

### Request-Based Booking Emails

| Template | Recipient | When | Must Include |
|----------|-----------|------|--------------|
| `supplier_new_request` | Supplier | Request created | Guest name, date, time, participants, **Accept button**, **Decline button** |
| `guest_request_received` | Guest | Request created | Experience name, date, time, "waiting for confirmation" message |

### Decision Phase (Request-Based Only)

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

### When Guest Picks Session (Session-Based Booking)
- Deduct spots from session immediately
- Create reservation with status `approved`
- Create Payment Link with reservation metadata
- Store payment link URL on reservation record
- **No supplier approval needed**

### When Supplier Accepts (Request-Based Booking)
- **Create or reuse session for requested date/time**:
  - Check if session exists for that date/time
  - If exists: Reuse and update spots_available
  - If not: Create new session with full capacity, making it visible in widget
  - Link reservation to session (sets `session_id`)
- Create Payment Link with reservation metadata
- Store payment link URL on reservation record

### When Payment Succeeds (Webhook)
- Listen for `payment_intent.succeeded` or `checkout.session.completed` events
- Extract reservation ID from payment intent metadata (or look up via payment link if metadata missing)
- Create booking record with charge ID stored
- Calculate split amounts based on distribution table
- **Idempotency**: Check if booking already exists before creating (prevents duplicates)

### When Completion Confirmed
- Retrieve charge ID from payment intent (if not already stored)
- Create Transfer to supplier's connected Stripe account:
  - Amount: `supplier_amount_cents` from booking record
  - Use `source_transaction` parameter (charge ID) - required for test mode transfers
  - This allows transfers even if platform balance is insufficient
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
| Multiple requests for same date/time | On accept, system checks for existing session and reuses it, updating spots accordingly |
| Request-based booking accepted | Session is automatically created, making remaining spots available to other guests in widget |

---

## Data to Store

### On Session-Based Reservation Creation
- Experience ID, Session ID, Hotel ID
- Guest name, email, phone
- Number of participants
- Total price in cents
- Payment deadline timestamp (24 hours)
- Stripe payment link ID and URL
- Status: **`approved`** (immediate)

### On Request-Based Reservation Creation
- Experience ID, Hotel ID (no session yet)
- Guest name, email, phone
- Number of participants
- Total price in cents
- Requested date/time
- Response deadline timestamp (48 hours)
- Status: **`pending`**

### On Supplier Accept (Request-Based Only)
- **Session ID** (created or reused for requested date/time)
- Payment deadline timestamp
- Stripe payment link ID and URL
- Status: `approved`

### On Payment Success
- Create booking record with:
  - **Session ID** (required - always available since sessions are created on accept)
  - Stripe payment intent ID
  - Stripe charge ID
  - Total amount, supplier amount, hotel amount, platform amount
  - Paid at timestamp
  - Status: `confirmed`

### On Completion
- Completion confirmed at timestamp
- Stripe transfer ID (created with `source_transaction` for test mode compatibility)
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

Traverum supports **two booking flows**:

### Flow A: Session-Based (Instant)
```
Guest picks session → Spots deducted → Pay immediately → Booking confirmed
```
- No supplier approval needed
- Guest can pay right away
- Supplier notified (FYI only)

### Flow B: Request-Based (Approval Required)
```
Guest requests time → Supplier approves → Session created → Pay → Booking confirmed
```
- Supplier must accept/decline
- On accept: Session created for requested time (visible to other guests!)
- Guest then pays

### Common Final Steps
1. **Payment** → Guest pays via Stripe link
2. **Settlement** → After experience, supplier confirms → Funds transferred

Everything happens via email links. No dashboards required for MVP.

The system is designed to be **self-correcting**: timeouts auto-expire stale requests, auto-completion ensures funds don't get stuck, and refunds happen automatically when needed.

**Business benefit**: Request-based bookings create new inventory (sessions) that suppliers can fill with additional guests, maximizing revenue from popular time slots.