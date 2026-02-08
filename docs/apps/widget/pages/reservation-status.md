Updated by Elias on 07-02-2026

# Reservation Status Page

## What & Why

**WHAT:** Status page for request-based bookings. Shown after submitting a custom request (before payment).

**WHY:** Guest needs to know their request was received and what to expect next. Also serves as the landing page for status checks.

**Route:** `/{hotelSlug}/reservation/{id}` (id = reservation UUID)

---

## Page Structure

Centered card layout (max-width 2xl). Content varies by reservation status:

### Status: Pending
- **Icon:** Clock (warning color)
- **Title:** "Request Sent!"
- **Message:** "Your booking request has been sent to the experience provider. They will respond within 48 hours."

### Status: Approved
- **Icon:** Checkmark (success color)
- **Title:** "Booking Approved!"
- **Message:** "Great news! Your booking has been approved. Check your email for the payment link."
- **CTA:** "Complete Payment" button (links to Stripe Payment Link)

### Status: Declined
- **Icon:** X mark (destructive color)
- **Title:** "Booking Unavailable"
- **Message:** "Unfortunately, the provider was unable to accept your booking for this time."

### Status: Expired
- **Icon:** Info circle (muted color)
- **Title (request):** "Request Expired"
- **Title (non-request):** "Booking Expired"
- **Message (request):** "This booking request has expired. The provider did not respond in time."
- **Message (non-request):** "This booking has expired. The payment window has closed."

---

## Booking Details Card (all statuses)

- Experience name
- Date (or "Custom request")
- Time (or "Custom request")
- Participants
- Total price (accent color)

---

## Footer

- "Back to experiences" link
- Email notice: "We've sent a confirmation email to **guest@email.com**"

---

## What's NOT Here

- No real-time status updates (guest must refresh or check email)
- No chat / messaging with supplier
- No option to modify the request
- No option to cancel from this page (only via email link)
