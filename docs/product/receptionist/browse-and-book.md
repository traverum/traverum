# Browse and Book for Guest

## Goal

**Route:** `/receptionist/`

The receptionist's primary screen. Browse the hotel's experiences, search and filter, then book on behalf of a walk-in guest. The guest never needs to touch a device. The receptionist enters guest details, picks a session (or sends a custom request), and submits. The guest receives a payment link by email.

This is the tool's core value: a guest walks up to the desk, asks "what can we do today?", and the receptionist handles everything.

## For whom

Hotel front desk staff helping walk-in guests. The guest is standing at the desk — speed matters. The receptionist mediates between the guest's interest and the available experiences.

## Key stories

- Guest asks "what can we do today?" — receptionist opens tool, sees recommended experiences with next available sessions, picks one
- Guest wants a wine tasting for 4 people — receptionist searches "wine", selects experience, picks session, enters guest name and email, books
- Guest doesn't have a preference — receptionist browses "Nearby" tab for all experiences within radius, filters by category tag
- Guest wants a date not shown in the calendar — receptionist uses custom request flow (picks date + time), request goes to supplier for approval
- Guest already booked one experience and wants another — guest name, email, and phone pre-fill from the previous booking (same session)
- Guest wants to see the full experience page — receptionist clicks "View on booking page" link to show the public guest view

## Design decisions

### Two experience tabs: Recommended vs Nearby

- **Recommended** = experiences the hotel has actively selected (has a distribution). These are the hotel's curated picks.
- **Nearby** = all active experiences within the hotel's PostGIS radius, excluding already-selected ones. Discovery pool for when the curated list doesn't match what the guest wants.
- Fallback: if the hotel has no location set, Nearby shows all active experiences.
- Selected experiences show `isSelected: true` badge. Nearby shows `isSelected: false`.

### Experience cards

- Grid layout (3 columns desktop, 1 mobile) when no experience is selected
- Compact list (1 column) when BookingPanel is open on the right
- Each card shows: cover image, title, supplier name, next session date and time, price, distance (Nearby tab only)
- Search input filters by title, supplier name, or tags
- Category tag pills at the top for quick filtering (top 8 tags by frequency)

### BookingPanel (right side)

Opens when an experience card is clicked. Sticky panel, takes roughly 2/3 width on desktop. Contains everything needed to understand the experience and complete a booking:

- **Header:** cover image, title, supplier name, duration, capacity, languages
- **Hotel notes:** accent-colored block with operational info from the supplier — meeting point details, dress codes, arrival times, guest requirements. Labeled "Message from supplier". Only visible here and in hotel dashboard, never on the guest widget.
- **Guest view link:** opens the experience on the hotel's public widget page or Veyond direct
- **Meeting point:** address with Google Maps link
- **Contact supplier:** WhatsApp, Call, Email buttons (see [contact-supplier.md](contact-supplier.md))
- **Cancellation policy:** displayed from experience settings
- **Session picker:** reuses the guest widget's SessionPicker component for date and time selection
- **Participant/quantity selector:** reuses the guest widget's ParticipantSelector (adapts for per-person vs per-unit pricing)
- **Guest info form:** name (required), email (required), phone (optional)
- **Price calculation:** uses shared `calculatePrice()`, supports per_person, tiered, and per_day pricing models
- **Submit button:** "Book" for direct session bookings, "Send Request" for custom date or rental requests

### Booking submission

- POSTs to `/api/reservations` with `source: 'receptionist'` and `bookedByUserId` set to the current user
- Commission auto-distributes at 92/0/8 (supplier/hotel/platform) for self-owned receptionist bookings
- On success: shows confirmation with booking details, auto-copies payment link to clipboard, offers "Book Another" button
- Guest details (name, email, phone) persist in component state to pre-fill the next booking

### Authentication

- `getReceptionistContext()` checks Supabase auth session + `user_partners` table membership
- Allowed roles: `receptionist`, `owner`, `admin`
- Resolves hotel config via `user_partners.hotel_config_id`, or falls back to the first config for the partner
- Unauthenticated users redirect to `/receptionist/login`
- Authenticated users without a valid receptionist role see "Access Not Available" with a role-specific error message

## Not yet implemented

- **Payment on behalf of guest (US4):** currently the receptionist can only trigger a payment link sent to the guest's email. Direct payment entry at the desk is planned.
- **Availability rules integration:** availability rules are passed as an empty array to SessionPicker — full rule enforcement is not yet wired up.

## References

- Auth: `apps/widget/src/lib/receptionist/auth.ts`
- Experiences fetch: `apps/widget/src/lib/receptionist/experiences.ts`
- Page: `apps/widget/src/app/receptionist/(protected)/page.tsx`
- Client component: `apps/widget/src/app/receptionist/(protected)/BookClient.tsx`
- BookingPanel: `apps/widget/src/components/receptionist/BookingPanel.tsx`
- ExperienceCard: `apps/widget/src/components/receptionist/ExperienceCard.tsx`
- Booking flow: `docs/product/system/booking-flow.md`
- Pricing: `docs/product/system/pricing.md`
