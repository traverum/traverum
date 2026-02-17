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

- Price display varies by type: per person ("€45 / person"), flat rate ("€200 total"), base+extras ("€120 for 4"), rental ("€50 / day")
- "Select Date" → opens date picker
- Participants: +/− buttons, enforces max. For rentals, labeled "Quantity" with "unit(s)" instead of "person/people".
- Price breakdown (calculation varies by pricing type)
- CTA: "Book Now — €total" (session) or "Request Booking — €total" (custom request / rental). Disabled until date selected.

### Rental-specific behavior

For `per_day` experiences, the booking panel shows:
1. **"Select Date"** → opens single-date calendar (not a date range)
2. **"Number of days"** dropdown → values from `min_days` to `max_days` (or 30 if no max)
3. **"Quantity"** selector → +/− buttons, 1 to `max_participants`
4. **Price breakdown**: "€50/day × 3 days × 2 units = €300"
5. **CTA is always "Request Booking"** — rentals are always request-based

## Date Picker

- Calendar month view. Disabled: past dates, days outside availability/seasonal rules. Future limit: 1 year.
- Dots on dates with existing sessions (not shown for rentals)

### Session-based experiences
- **Sessions available:** List with time and price. Click to select → instant booking path.
- **Custom request:** "Request a different time" → time picker grid, 30-min slots within operating hours, grouped Morning/Afternoon/Evening.

### Rental experiences (`per_day`)
- **Single date only** — no date range selection
- Calendar shows available dates (based on availability rules)
- Below the calendar: "Number of days" dropdown (values from `min_days` to `max_days`)
- Confirm button: "Confirm Selection"
