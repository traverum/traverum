# Checkout

## Purpose

**Route:** `/{hotelSlug}/checkout?experienceId=...&participants=...&total=...`

Last step before payment or request submission. Guest enters their details and sees a summary of what they're booking.

The page should feel trustworthy and simple. Two-column on desktop (form left, summary right), single column on mobile. No unnecessary fields, no distractions.

## Key decisions

- Fields: first name, last name, email, phone (all required). Validated with Zod + react-hook-form.
- Session booking: "Book Now" → creates reservation, redirects to Stripe Payment Link
- Custom request / rental: "Send Request" → creates reservation, redirects to reservation status page
- Booking summary card: cover image, experience title, duration, date/time, participants, total price
- "Custom Request" badge shown when request-based
- Rental summary: shows "Start date", "Duration: X days", "Quantity: Y" instead of date/time/participants
- Missing required URL params → redirect back to hotel experience list
- Demo mode: for `hotel-traverum` slug, shows success animation without real API call

## Reference

- Booking flow: `docs/purpose/booking-flow.md`
- Code: `apps/widget/src/app/[hotelSlug]/checkout/page.tsx`
