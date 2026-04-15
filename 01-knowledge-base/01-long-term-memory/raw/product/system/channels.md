# Two Channels, One Engine

## Goal

Traverum serves guests through two distinct channels — but both use the same booking engine, same APIs, same payment flow, and same email templates. The channel determines branding and commission split, nothing else.

## For whom

This is a platform-level product decision that affects all personas: guests see different branding, suppliers receive different commission shares, and hotels only participate in one channel.

## The two channels

### Hotel channel (white-label)

- **URL:** `book.veyond.eu/{hotelSlug}` or embedded on the hotel's website
- **Branding:** Hotel's brand — their colors, fonts, logo. Traverum/Veyond is invisible (footer only).
- **Commission:** Three-way split — supplier (default 80%) + hotel (default 12%) + platform (8%). Configurable per experience-hotel pair via the `distributions` table.
- **How it works:** Hotels embed a widget (`<veyond-widget hotel="slug">`). Guests browse and book through what appears to be the hotel's own experience program.
- **Technical signal:** `reservation.hotel_id` is set.

### Veyond direct channel

- **URL:** `veyond.app` (previously `book.veyond.eu/experiences`, 301 redirects in place)
- **Branding:** Veyond brand. No hotel involved.
- **Commission:** Two-way split — supplier (92%) + platform (8%). Uses `SELF_OWNED_COMMISSION` constant from `@traverum/shared`.
- **How it works:** All active experiences are browsable and bookable. Notification email to `info@traverum.com` on every direct booking.
- **Technical signal:** `reservation.hotel_id` is null.

## Design decisions

### Channel is determined by presence of hotel_id

A reservation with `hotel_id = null` is a direct Veyond booking. Same code path, same status transitions, same emails — only branding and commission calculation differ. No separate booking flows, no channel-specific API routes.

### Commission is the business model

Every flow ends in a commission split. This is non-negotiable:
- Hotel channel: supplier + hotel + platform = 100%
- Direct channel: supplier + platform = 100%

Rounding remainder always goes to platform. Commission splits use `Math.round()` with integer cents.

### Location-based matching (hotel channel only)

Hotels see experiences within a configurable radius (PostGIS). Suppliers operating in multiple areas create separate experiences. This ensures guests only see relevant, nearby experiences.

## References

- Vision: `docs/product/vision.md`
- Booking flow: `docs/product/system/booking-flow.md`
- Commission code: `apps/widget/src/lib/commission.ts`
- Shared constants: `packages/shared/src/constants.ts`
