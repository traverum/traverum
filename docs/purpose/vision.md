# Traverum Vision

## Purpose

Traverum exists to solve a problem that no one has solved well:

**Hotels** want to offer local experiences to their guests — it enhances the stay, drives revenue, and differentiates the property. But building and operating an experience program is expensive, complex, and outside their expertise.

**Suppliers** (tour operators, guides, rental companies) have great experiences but struggle to reach tourists. Marketing is expensive, and being discovered by the right travelers at the right time is nearly impossible.

**Guests** want authentic local experiences but don't know what's available, don't trust random booking platforms, and would rather book through their hotel — a source they already trust.

Traverum is the infrastructure that connects all three. Hotels embed a branded widget. Suppliers manage availability. Guests book and pay — through their hotel or directly through Veyond. Everyone earns their share.

Through the hotel channel, the guest never knows Traverum exists — the hotel looks like they run the experience program. Through Veyond's own booking platform, guests discover and book experiences directly under the Veyond brand.

## Key decisions

- **Two channels, one engine.** Hotel widget (white-label, hotel earns commission) and Veyond direct (`book.veyond.eu/experiences`, Veyond-branded, no hotel commission). Same booking engine, same APIs, same code.
- **White-label for hotels.** The widget looks like it belongs to the hotel. Custom colors, fonts, domain. Traverum branding is minimal (footer only).
- **Veyond direct for travelers.** All active experiences are browsable and bookable at `book.veyond.eu/experiences`. Veyond branding. No hotel involved. Notification email to `info@traverum.com` on every direct booking.
- **Commission model.** Hotel channel: supplier (default 80%) + hotel (default 12%) + platform (8%), configurable per experience-hotel pair via the `distributions` table. Direct channel: supplier (92%) + platform (8%), no hotel share. Determined by whether `reservation.hotel_id` is null.
- **Supplier self-service.** Suppliers manage their own experiences, sessions, pricing, and bookings. No Traverum staff involvement in day-to-day operations.
- **Hotel zero-effort.** Hotels embed once, toggle experiences on/off, and earn. No booking management, no customer service.
- **Location-based matching.** Hotels see experiences within a configurable radius (PostGIS). Suppliers operating in multiple areas create separate experiences.

## Reference

- Cursor rule: `.cursor/rules/product-vision.mdc`
- Glossary: `docs/technical/glossary.md`
- Account scenarios: `docs/technical/account-scenarios.md`
