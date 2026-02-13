# Experience Detail

**Route:** `/{hotelSlug}/{experienceSlug}` (e.g. `/hotel-rosa/wine-tasting`)

**Purpose:** Full detail view of a single experience. Guest sees what's involved, picks date/time and participants, proceeds to checkout.

## Layout

- **Desktop:** Two columns — left (3/5) content, right (2/5) sticky booking panel
- **Mobile:** Single column + sticky bottom bar with price + "Check Availability" → opens bottom sheet with booking controls

## Content (left column)

- Image gallery (horizontal scroll, swipe on mobile)
- Title + meta: duration, max participants (e.g. "2 hours · Up to 8 people")
- Description (markdown supported)
- Info sections: how booking works, cancellation policy, meeting point (if set)

## Booking Panel (right column / mobile bottom sheet)

- Price display varies by type: per person ("€45 / person"), flat rate ("€200 total"), base+extras ("€120 for 4")
- "Select Date" → opens date picker
- Participants: +/− buttons, enforces max
- Price breakdown (calculation varies by pricing type)
- CTA: "Book Now — €total" (session) or "Request Booking — €total" (custom request). Disabled until date selected.

## Date Picker

- Calendar month view. Disabled: past dates, days outside availability/seasonal rules. Future limit: 1 year.
- Dots on dates with existing sessions
- **Sessions available:** List with time and price. Click to select → instant booking path.
- **Custom request:** "Request a different time" → time picker grid, 30-min slots within operating hours, grouped Morning/Afternoon/Evening.
