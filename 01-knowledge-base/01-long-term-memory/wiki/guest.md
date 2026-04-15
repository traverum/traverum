---
type: entity
created: 2026-04-15
updated: 2026-04-15
sources:
  - guest/_overview.md
  - guest/discover.md
  - guest/book.md
  - guest/checkout-and-pay.md
  - guest/track-reservation.md
  - guest/after-experience.md
tags: [persona, guest, traveler, widget, booking]
---

# Guest

Tourists and travelers looking for local experiences — wine tastings, guided tours, boat trips, equipment rentals. They arrive through a hotel's embedded widget or directly through Veyond. Often not tech-savvy, often on mobile.

**App:** Widget (`apps/widget`)
**Routes:** `/{hotelSlug}/*` (hotel [[channels|channel]]), `/experiences/*` (Veyond direct)

## Promise

Trusted, beautiful, effortless [[booking]]. Discover curated experiences, see clear [[pricing]], pick a time, enter details, pay. Done. If requesting a custom time, response within 48 hours. Always clear status, always clear next steps.

## Success

- Books in under 3 minutes from first click to payment
- Never confused about what happens next
- Feels like the hotel's own program, not a third-party marketplace

## Never

- Pays but [[supplier]] doesn't know
- Left wondering about request status
- Broken or foreign-looking widget on hotel's website
- Hidden fees or surprise charges

## Journey

### 1. Discover — `/{hotelSlug}`

First impression. A grid of experiences offered through the hotel. Goal: get the guest excited and clicking.

- Hotel logo + name in header (full-page mode), links to hotel website
- Configurable title/subtitle (supports `{{hotel_name}}` placeholder)
- Category filter tabs from experience tags (full-page only)
- 3-column card grid (1 on mobile). Cover image + title overlay. **No prices on cards.**
- Section embed mode (`?embed=section`): no header, resize script posts height to parent

### 2. Book — `/{hotelSlug}/{experienceSlug}`

The conversion moment. Desktop: two columns (content left, sticky booking panel right). Mobile: single column with sticky bottom bar.

**Content side:** Image gallery (horizontal scroll), title + meta (duration, max participants), description (markdown), info sections (how booking works, [[cancellation]] policy, meeting point).

**Booking panel:**
- Price display adapts to [[pricing]] type
- Calendar month view, dots on dates with sessions, past dates disabled
- Session list on date click with times and prices
- "Request a different time" → time picker grid (30-min slots, Morning/Afternoon/Evening)
- Participants: +/- buttons, enforces min/max from `min_participants`
- CTA: "Book Now" (session) or "Send Request" (custom request / rental)

**Rental-specific:** Single date picker, "Number of days" dropdown, quantity selector for units, always "Request Booking", price breakdown: "€50/day × 3 days × 2 units = €300"

### 3. Checkout — `/{hotelSlug}/checkout?experienceId=...&participants=...&total=...`

Last step. Two-column on desktop (form left, summary right), single on mobile.

- Fields: first name, last name, email, phone (all required, Zod + react-hook-form)
- Session [[booking]]: "Book Now" → create reservation → redirect to Stripe Payment Link
- Custom request / rental: "Send Request" → create reservation → redirect to reservation status
- Summary card: cover image, title, duration, date/time, participants, total
- Rental summary: start date, duration (X days), quantity (Y)
- Missing URL params → redirect to experience list
- Demo mode for `hotel-traverum` slug

### 4. Track reservation — `/{hotelSlug}/reservation/{id}`

Status page for request-based bookings.

| Status | Display | Details |
|--------|---------|---------|
| Pending (request) | "Request Sent!" | Provider responds within 48h |
| Pending (session) | "Booking Processing!" | Being processed |
| Approved | "Booking Approved!" | CTA: "Complete Payment" → Stripe |
| Declined | "Booking Unavailable" | Clear, no confusion |
| Expired | "Request Expired" / "Booking Expired" | Supplier didn't respond or payment window closed |

Booking details card always visible: experience name, date/time, participants, total price. Footer: "Back to experiences" + email notice.

### 5. After experience — `/{hotelSlug}/confirmation/{id}`

Success page after payment. Green checkmark + "Booking Confirmed!" Email notice, booking reference (`TRV-XXXXXX`), details (name, date, time, participants, meeting point, total), what's next section, "Browse More Experiences" CTA.

## Related pages

- [[booking]] — Core flow mechanics
- [[payment-modes]] — Stripe vs pay-on-site from guest perspective
- [[pricing]] — What guests see at checkout
- [[channels]] — Hotel widget vs Veyond direct
- [[cancellation]] — Guest-facing policies
