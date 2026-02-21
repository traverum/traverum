# Booking Confirmation

## Purpose

**Route:** `/{hotelSlug}/confirmation/{id}`

Success page after payment. The guest should feel confident that everything worked. Clear confirmation, booking details, and next steps.

## Key decisions

- Green checkmark + "Booking Confirmed!"
- Email notice: "We've sent a confirmation email to guest@email.com"
- Booking reference (first 8 chars of ID, uppercase monospace)
- Booking details: experience name, date, time, participants, meeting point (if set), total paid
- What's next section: confirmation email sent, arrive on time, provider may contact you
- CTA: "Browse More Experiences" → back to hotel experience list

## Reference

- Code: `apps/widget/src/app/[hotelSlug]/confirmation/[id]/page.tsx`
