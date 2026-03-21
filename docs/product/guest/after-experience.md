# After the Experience

## Goal

**Route:** `/{hotelSlug}/confirmation/{id}`

Success page after payment. The guest should feel confident that everything worked. Clear confirmation, booking details, and next steps.

## For whom

Guests who just completed payment. They need reassurance that the booking went through and clarity on what happens next.

## Key stories

- Guest pays → sees green checkmark and "Booking Confirmed!" → knows confirmation email is on the way
- Guest sees booking reference, experience details, meeting point, and total paid
- Guest wants to keep browsing → clicks "Browse More Experiences" to return to the experience list

## Design decisions

- Green checkmark + "Booking Confirmed!"
- Email notice: "We've sent a confirmation email to guest@email.com"
- Booking reference (first 8 chars of ID, uppercase monospace)
- Booking details: experience name, date, time, participants, meeting point (if set), total paid
- What's next section: confirmation email sent, arrive on time, provider may contact you
- CTA: "Browse More Experiences" → back to hotel experience list

## References

- Code: `apps/widget/src/app/[hotelSlug]/confirmation/[id]/page.tsx`
