Updated by Elias on 07-02-2026

# Booking Confirmation Page

## What & Why

**WHAT:** Success page shown after payment is completed via Stripe.

**WHY:** Guest needs confirmation that payment went through, with booking details and next steps.

**Route:** `/{hotelSlug}/confirmation/{id}` (id = booking ID or reservation ID)

---

## Page Structure

Centered card layout (max-width 2xl):

### Success Icon
- Green checkmark in circle

### Title
- "Booking Confirmed!"

### Email Notice
- "Thank you for your booking. We've sent a confirmation email to **guest@email.com**"

### Booking Reference
- Shows first 8 chars of booking ID in monospace uppercase (e.g. "A3F2B1C9")

### Booking Details Card
- Experience name
- Date (formatted DD.MM.YYYY or "TBD")
- Time (formatted HH:MM or "TBD")
- Participants count
- Meeting point (if set)
- **Total Paid** (accent color, separated by border)

### What's Next Section
- ✅ Confirmation email sent to your inbox
- 🕐 Arrive at the meeting point on time
- 🔔 The provider may contact you with more details

### CTA Button
- "Browse More Experiences" → back to hotel experience list

---

## What's NOT Here

- No booking modification option
- No cancel button (cancellation via email link only)
- No calendar add (e.g. Google Calendar / iCal)
- No PDF receipt download
