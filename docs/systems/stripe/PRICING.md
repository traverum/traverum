# How Payments Work

## The Big Picture

Traverum handles money between three parties: the **guest** who pays, the **supplier** who delivers the experience, and the **hotel** that referred the guest. Stripe handles all payment processing. No one touches cash.

Every booking is for **one group only**. When a guest books a session, that session belongs to them — no other parties can join.

---

## Two Booking Paths, Two Payment Moments

### Session booking (instant)

The guest picks an existing time slot and pays immediately.

1. Guest selects experience, session, and number of people
2. Guest fills in their details on the checkout page
3. Session is claimed — disappears from the widget
4. Guest clicks "Book Now" — redirected to Stripe Checkout
5. Guest pays — booking is confirmed instantly
6. Guest sees confirmation page and gets a confirmation email

### Custom request (approval needed)

The guest asks for a specific date/time. The supplier has to accept before payment happens.

1. Guest picks a custom date and time
2. Guest fills in their details and clicks "Send Request"
3. Guest sees a "Request Sent" status page — waiting for the supplier
4. Supplier reviews and accepts (or declines)
5. If accepted — a private session is created (visible in supplier calendar only, not in the widget)
6. Guest receives an email with a payment link
7. Guest pays via the payment link — booking confirmed
8. If the supplier doesn't respond within 48 hours, the request expires

---

## After Payment

Once a guest has paid, the money sits with Traverum until the experience actually happens. This protects the guest.

1. **Experience takes place** — the supplier marks it as complete
2. **Supplier gets paid** — their share is transferred to their connected bank account (typically arrives in 2-3 business days)
3. If the supplier doesn't mark it complete within 7 days, it auto-completes and the payout happens anyway

---

## The Money Split

Every booking is split three ways:

| Who | Standard | Self-owned (hotel runs their own experience) |
|-----|----------|----------------------------------------------|
| Supplier | 80% | 92% |
| Hotel | 12% | 0% |
| Traverum | 8% | 8% |

The split is calculated at the moment of payment and recorded on the booking.

---

## Cancellations and Refunds

### Guest cancels

Whether the guest gets their money back depends on timing:

- **7+ days before the experience** — full refund, session becomes available again
- **Less than 7 days** — cancellation is no longer available

Guests cancel via a link in their confirmation email. If eligible, the refund goes back to their original payment method automatically.

### Experience doesn't happen

If the supplier reports the experience didn't take place (weather, illness, etc.), the guest gets a full refund. The supplier receives nothing.

### Guest no-show

If the guest doesn't show up, the supplier reports it. No refund — supplier gets paid normally.

---

## Supplier Payouts

Suppliers connect their bank account through Stripe during onboarding. They don't need to invoice anyone or chase payments — their share is sent automatically after each completed experience.

---

## What Emails Go Out

| Moment | Who gets an email |
|--------|-------------------|
| Session booked (pending payment) | Guest + Supplier |
| Custom request submitted | Supplier (Accept/Decline buttons) |
| Request approved (payment link) | Guest |
| Request declined | Guest |
| Request expired (48h) | Guest |
| Payment confirmed | Guest + Supplier |
| Payment failed | Guest |
| Payment window closed (24h) | Guest + Supplier |
| Completion check (day after) | Supplier (Yes/No buttons) |
| Payout sent to supplier | Supplier |
| Refund processed | Guest |

---

## Why It Works This Way

- **Guests pay before the experience** — commitment is real, no-shows drop
- **One group per session** — no confusion about who's joining, clean and simple
- **Money is held until delivery** — guests are protected if something goes wrong
- **Suppliers get paid automatically** — no invoices, no chasing, no delay
- **Hotels earn without lifting a finger** — commission on every booking through their property
- **Everything goes through Stripe** — secure, compliant, no manual handling
