# Booking Confirmation

**Route:** `/{hotelSlug}/confirmation/{id}`

**Purpose:** Success page after Stripe payment. Confirms booking with details and next steps.

- Green checkmark + "Booking Confirmed!"
- Email notice: "We've sent a confirmation email to **guest@email.com**"
- Booking reference (first 8 chars of ID, uppercase monospace)
- Booking details: experience name, date, time, participants, meeting point (if set), total paid
- What's next: confirmation email sent, arrive on time, provider may contact you
- CTA: "Browse More Experiences" → back to hotel experience list
