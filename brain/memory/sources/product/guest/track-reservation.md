# Track Reservation

## Goal

**Route:** `/{hotelSlug}/reservation/{id}`

Status page for request-based bookings. Shown after submitting a custom request (before payment). Also the landing page when guests check status via email links.

The guest should always know exactly where their request stands and what happens next.

## For whom

Guests who submitted a booking request and are waiting for the supplier to respond, or who have been approved and need to pay.

## Key stories

- Guest submits a request → sees "Request Sent!" with 48-hour response expectation
- Supplier approves → guest revisits page (or clicks email link) → sees "Booking Approved!" with payment button
- Supplier declines → guest sees "Booking Unavailable" — clear, no confusion
- Supplier doesn't respond in 48h → guest sees "Request Expired"

## Design decisions

### Status variants

- **Pending (request):** Clock icon. "Request Sent!" — provider will respond within 48 hours.
- **Pending (session):** Clock icon. "Booking Processing!" — for non-request bookings being processed.
- **Approved:** Checkmark. "Booking Approved!" — check email for payment link. CTA: "Complete Payment" (links to Stripe Payment Link).
- **Declined:** X mark. "Booking Unavailable" — provider unable to accept.
- **Expired:** Info icon. "Request Expired" (supplier didn't respond) or "Booking Expired" (payment window closed).

### Always visible

Booking details card on all statuses: experience name, date/time (or "Custom request" if no specific time), participants, total price. Footer: "Back to experiences" link + email notice.

## References

- Booking flow: `docs/product/system/booking-flow.md`
- Code: `apps/widget/src/app/[hotelSlug]/reservation/[id]/page.tsx`
