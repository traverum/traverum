Updated by Elias on 07-02-2026

# Experience Detail Page

## What & Why

**WHAT:** Full detail view of a single experience with booking controls.

**WHY:** Guest needs to see what the experience involves, pick a date/time, choose participants, and proceed to checkout.

**Route:** `/{hotelSlug}/{experienceSlug}` (e.g. `/hotel-rosa/wine-tasting`)

---

## Page Layout

### Desktop (md+)
Two-column layout:
- **Left (3/5):** Image gallery, title, description, info sections
- **Right (2/5):** Sticky booking panel

### Mobile
- Single column: image, title, description, info
- Sticky bottom bar with price + "Check Availability" button
- Bottom sheet opens with full booking controls

---

## Left Column — Content

### Image Gallery
- Scrollable horizontal gallery with dots indicator
- Touch/swipe support on mobile
- Fallback placeholder if no images

### Title & Meta
- Experience title (heading font)
- Duration + max participants (e.g. "2 hours · Up to 8 people")

### Description
- Rich text with markdown support (bold, links, line breaks)

### Info Sections (below description, separated by border)
- **How it works** — "Reserve now — free and non-binding. Pay after provider confirms."
- **Cancellation** — "Free cancellation up to 7 days before."
- **Meeting point** — Only shown if experience has one set

---

## Right Column — Booking Panel (Desktop)

### Price Display
- Shows price based on pricing type:
  - Per person: "€45 / person"
  - Flat rate: "€200 total"
  - Base + extras: "€120 for 4" (included participants)

### Date Selection
- "Select Date" button → opens date picker drawer
- Shows selected date/time when chosen

### Participants
- `−` and `+` buttons
- Range: `min_participants` to `max_participants`
- Enforces minimum (price calculated on effective participants)

### Price Breakdown
- Shows total calculation:
  - Per person: "X participants × €45 = €total"
  - Base + extras: "Base €120 + X extra × €30 = €total"
  - Flat rate: just the total
- Minimum participant notice if applicable

### CTA Button
- **Session selected:** "Book Now — €total" → checkout
- **Custom request:** "Request Booking — €total" → checkout with `isRequest=true`
- Disabled until date is selected

---

## Date Picker / Session Picker

Opened by clicking "Select Date" (desktop drawer) or "Check Availability" (mobile bottom sheet).

### Calendar
- Month view with navigation (prev/next month)
- **Disabled dates:**
  - Past dates (before today)
  - Days outside availability rules (e.g. Sundays, Mondays if not in weekdays)
  - Days outside seasonal range (if `valid_from`/`valid_until` set)
- **Session indicators:** Dots on dates that have existing sessions
- **Future limit:** 1 year ahead

### Session List (when date has sessions)
- Shows existing sessions for selected date
- Each session shows: time, spots remaining, price (if custom)
- Click to select → instant booking path

### Custom Request (when no sessions / guest wants different time)
- "Request a different time" option
- Time picker grid with 30-minute slots
- **Only shows times within operating hours** (from availability rules, e.g. 08:00–18:00)
- Time grouped by: Morning (before 12:00), Afternoon (12:00–17:00), Evening (17:00+)
- Groups only appear if they have valid time slots

### Selected State
- Selected session or custom date/time highlighted with checkmark
- Selection shown in booking panel summary

---

## Mobile Booking Flow

### MobileBookingBar (sticky bottom)
- Shows price and "Check Availability" button
- Always visible on experience detail page (mobile only)

### BottomSheet
- Opens from MobileBookingBar
- Contains: SessionPicker + Participants + Price + CTA
- Swipe-to-close, backdrop click to close

---

## What's NOT Here

- No reviews or ratings
- No "similar experiences" recommendations
- No social sharing buttons
- No experience location map
- No supplier info / profile
