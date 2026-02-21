# Experience Detail

## Purpose

**Route:** `/{hotelSlug}/{experienceSlug}`

This is where the guest decides to book. They need to understand what the experience involves, see when it's available, and know the price — then commit with as few clicks as possible.

**Desktop:** Two columns — content on the left (images, description, details), sticky booking panel on the right. The booking panel is always visible while scrolling.

**Mobile:** Single column with a sticky bottom bar showing price + "Check Availability" button that opens a bottom sheet with booking controls.

## Key decisions

### Content

- Image gallery (horizontal scroll, swipe on mobile)
- Title + meta: duration, max participants (e.g., "2 hours · Up to 8 people")
- Description (markdown supported)
- Info sections: how booking works, cancellation policy, meeting point (if set)

### Booking panel

- Price display adapts to pricing type: per person / flat rate / base+extras / per day
- Date picker: calendar month view, past dates disabled, dots on dates with existing sessions
- For sessions: clicking a date shows available sessions with times and prices
- Custom request: "Request a different time" → time picker grid (30-min slots, grouped Morning/Afternoon/Evening)
- Participants: +/− buttons, enforces min/max
- CTA: "Book Now" (session) or "Send Request" (custom request / rental). Disabled until date selected.

### Rental-specific behavior

- Single date picker (not a date range)
- "Number of days" dropdown (constrained by min/max days)
- "Quantity" selector for units instead of participants
- CTA is always "Request Booking" — rentals are always request-based
- Price breakdown: "€50/day × 3 days × 2 units = €300"

## Reference

- Cursor rule: `.cursor/rules/widget-conventions.mdc`
- Pricing logic: `docs/purpose/pricing.md`
- Code: `apps/widget/src/app/[hotelSlug]/[experienceSlug]/page.tsx`
