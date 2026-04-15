---
type: entity
created: 2026-04-15
updated: 2026-04-15
sources:
  - receptionist/_overview.md
  - receptionist/browse-and-book.md
  - receptionist/contact-supplier.md
  - receptionist/track-bookings.md
tags: [persona, receptionist, front-desk, concierge, hotel]
---

# Receptionist

Hotel front desk staff. They interact with [[guest|guests]] face-to-face and need a fast, simple tool to browse experiences, make recommendations, and create bookings on behalf of guests. Not the hotel manager — they don't configure the widget or select experiences.

Owners and admins of the hotel partner can also access the receptionist tool (allowed roles: `receptionist`, `owner`, `admin`).

**App:** Widget (`apps/widget`)
**Routes:** `/receptionist/login`, `/receptionist/`, `/receptionist/bookings`

## Promise

A simplified, fast concierge interface. Browse available experiences, see today's availability, read operational notes from [[supplier|suppliers]], contact suppliers for urgent questions, create bookings for walk-in guests. No configuration — just the [[booking]] flow from the hotel's perspective.

## Success

- Finds relevant experience for a guest in under 30 seconds
- Creates a [[booking]] on behalf without guest touching a device
- Sees today's sessions at a glance
- Reads supplier notes (meeting point, dress code) and relays to guest
- Contacts a [[supplier]] in one tap
- Needs no training beyond a 5-minute walkthrough

## Never

- Accidentally modifies [[hotel]] configuration or experience selection
- Interface is as complex as the [[supplier]] dashboard
- Walk-in guest can't book because tool is too slow
- Guest data entered is not sanitized

## Journey 1: Browse and book — `/receptionist/`

Core workflow. Guest walks up: "What can we do today?" Receptionist handles everything.

### Two tabs: Recommended vs Nearby

- **Recommended:** Experiences the [[hotel]] actively selected (has a `distribution`). Curated picks.
- **Nearby:** All active experiences within PostGIS radius, excluding already-selected. Discovery pool for when curated list doesn't match.
- Fallback: if hotel has no location, Nearby shows all active experiences.

### Experience cards

- Grid (3 col desktop, 1 mobile) when no experience selected
- Compact list (1 col) when BookingPanel open
- Card: cover image, title, supplier name, next session date/time, price, distance (Nearby only)
- Search input filters by title, supplier name, or tags
- Category tag pills (top 8 by frequency)

### BookingPanel (right side)

Opens on card click. Sticky, ~2/3 width on desktop:

- **Header:** cover image, title, [[supplier]] name, duration, capacity, languages
- **Hotel notes:** accent block with operational info ("Message from supplier"). **Only visible here and hotel dashboard, never guest-facing.**
- **Guest view link:** opens public widget page
- **Meeting point:** address + Google Maps link
- **Contact supplier:** WhatsApp, Call, Email buttons
- **[[Cancellation]] policy**
- **Session picker:** reuses guest widget's SessionPicker
- **Participant/quantity selector:** adapts for [[pricing]] type
- **Guest info form:** name (required), email (required), phone (optional)
- **Price calculation:** shared `calculatePrice()`
- **Submit:** "Book" (session) or "Send Request" (custom/rental)

### Booking submission

- POSTs to `/api/reservations` with `source: 'receptionist'`, `bookedByUserId`
- [[Commission]]: 92/0/8 (supplier/hotel/platform) for self-owned receptionist bookings
- Success: confirmation, auto-copies payment link, "Book Another" button
- Guest details persist in state for pre-fill on next booking

### Auth

- `getReceptionistContext()` checks Supabase auth + `user_partners` membership
- Resolves hotel config via `user_partners.hotel_config_id` or falls back to first config
- Unauthenticated → `/receptionist/login`
- Wrong role → "Access Not Available" with role-specific error

## Journey 2: Track bookings — `/receptionist/bookings`

"My bookings" ledger. All bookings created by this receptionist.

### Filter tabs

- **All:** everything booked
- **Active:** confirmed, awaiting payment, or request pending
- **Completed:** fully completed
- **Past:** expired, declined, cancelled

### Booking cards

- Collapsed: guest name, status badge, experience title, date/time, price, participants
- Expanded (click): guest email (mailto), phone (tel), creation date
- **Payment link actions** (awaiting-payment only): "Copy Link" and "Open"

### Status mapping

| Condition | Display |
|-----------|---------|
| Booking completed | Completed |
| Booking cancelled | Cancelled |
| Booking exists (other) | Confirmed |
| Reservation approved, no booking | Waiting for payment |
| Reservation pending | Request pending |
| Reservation declined | Declined |
| Reservation expired | Expired |

Data: `reservations` where `booked_by_user_id` = current user, joined with `experiences` and `sessions`, cross-referenced with `bookings`. Limited to 100 most recent.

## Journey 3: Contact supplier

Inside BookingPanel. Three channels as button grid:

1. **WhatsApp** — pre-filled message with hotel name + experience title. Green accent. Requires phone.
2. **Call** — `tel:` link. Requires phone.
3. **Email** — `mailto:` with pre-filled subject. Always available.

Disabled channels show muted with dash icon (not hidden — consistent layout).

**Hotel notes** (`experiences.hotel_notes`): accent block labeled "Message from supplier". Meeting logistics, dress codes, arrival times, guest requirements. Only in receptionist tool and hotel dashboard.

## Not yet implemented

- **Payment on behalf of guest (US4):** currently sends payment link to guest email
- **Availability rules:** passed as empty array to SessionPicker

## Origin

Feedback from Hotel Tiche pilot: needed more operational info, direct [[supplier]] contact (WhatsApp), and ability to insert payment on behalf of guest.

## Related pages

- [[hotel]] — Hotel persona and widget
- [[guest]] — Guest journey (receptionist creates on their behalf)
- [[booking]] — Booking flow mechanics
- [[supplier]] — Supplier contact and notes
- [[channels]] — Hotel channel context
