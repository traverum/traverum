# Receptionist (Hotel Front Desk) — IN PROGRESS

## Where this lives
- **App:** Widget (`apps/widget`)
- **Routes:** `/receptionist/login`, `/receptionist/`, `/receptionist/bookings`
- **Key code:** `apps/widget/src/app/receptionist/`, `apps/widget/src/lib/receptionist/`, `apps/widget/src/components/receptionist/`

## Who is this person?

Hotel front desk staff. They interact with guests face-to-face and need a fast, simple tool to browse experiences, make recommendations, and create bookings on behalf of guests. They are not the hotel manager — they don't configure the widget or select experiences. They just need to help guests book.

Owners and admins of the hotel partner can also access the receptionist tool — the role check allows `receptionist`, `owner`, and `admin`.

## What do we promise them?

A simplified, fast concierge interface. Browse available experiences, see today's availability, read operational notes from suppliers, contact suppliers for urgent questions, and create bookings for walk-in guests. No supplier management, no configuration — just the booking flow from the hotel's perspective.

## Success looks like

- Finds a relevant experience for a guest in under 30 seconds
- Creates a booking on behalf of a guest without the guest needing to use the widget
- Sees today's available sessions at a glance
- Reads supplier notes (meeting point, dress code, arrival time) and relays them to the guest
- Contacts a supplier about logistics in one tap
- Never needs training beyond a 5-minute walkthrough

## What should never happen

- Receptionist accidentally modifies hotel configuration or experience selection
- The interface is as complex as the full supplier dashboard
- A walk-in guest can't book because the tool is too slow or confusing
- Guest data entered by the receptionist is not sanitized

## Journeys (in priority order)

1. [Browse and book](browse-and-book.md) — the core workflow: find an experience, book on behalf of a guest
2. [Track bookings](track-bookings.md) — see status of bookings made by this receptionist
3. [Contact supplier](contact-supplier.md) — reach supplier for logistics questions, read hotel-only notes

## Implementation status

| User Story | Status | Notes |
|------------|--------|-------|
| US1: Browse & book on behalf of guest | Implemented | Full flow with sessions, custom requests, rentals |
| US2: Hotel notes (operational info for hotels) | Implemented | `experiences.hotel_notes` displayed in BookingPanel |
| US3: Direct contact with suppliers | Partially implemented | WhatsApp, call, email links in BookingPanel |
| US4: Payment on behalf of guest | Planned | Receptionist currently sends payment link to guest |

## Origin

Feedback from Hotel Tiche during pilot:
- They want more operational info than the public guest page shows, so they can give guests better context
- They want direct contact with suppliers (WhatsApp) for urgent questions
- They want to insert payment information on behalf of the guest (already common practice for them with other services)
