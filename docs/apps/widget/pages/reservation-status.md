# Reservation Status

**Route:** `/{hotelSlug}/reservation/{id}`

**Purpose:** Status page for request-based bookings. Shown after submitting a custom request (before payment). Also landing page for status checks via email links.

**Status variants:**
- **Pending:** Clock icon. "Request Sent!" — provider will respond within 48 hours.
- **Approved:** Checkmark. "Booking Approved!" — check email for payment link. CTA: "Complete Payment" (Stripe Payment Link).
- **Declined:** X mark. "Booking Unavailable" — provider unable to accept.
- **Expired:** Info icon. Request: "Request Expired" (provider didn't respond). Non-request: "Booking Expired" (payment window closed).

**Booking details card (all statuses):** Experience name, date/time (or "Custom request"), participants, total price.

**Footer:** "Back to experiences" link + email notice.
