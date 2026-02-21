# Traverum Vision

## Purpose

Traverum exists to solve a problem that no one has solved well:

**Hotels** want to offer local experiences to their guests — it enhances the stay, drives revenue, and differentiates the property. But building and operating an experience program is expensive, complex, and outside their expertise.

**Suppliers** (tour operators, guides, rental companies) have great experiences but struggle to reach tourists. Marketing is expensive, and being discovered by the right travelers at the right time is nearly impossible.

**Guests** want authentic local experiences but don't know what's available, don't trust random booking platforms, and would rather book through their hotel — a source they already trust.

Traverum is the invisible infrastructure that connects all three. Hotels embed a branded widget. Suppliers manage availability. Guests book and pay. Everyone earns their share.

The guest never knows Traverum exists. The hotel looks like they run the experience program. The supplier gets customers without marketing. That's the product.

## Key decisions

- **White-label first.** The widget looks like it belongs to the hotel. Custom colors, fonts, domain. Traverum branding is minimal (footer only).
- **Three-party commission model.** Every booking splits revenue: supplier (default 80%) + hotel (default 12%) + platform (8%). Configurable per experience-hotel pair via the `distributions` table.
- **No marketplace.** Guests don't browse Traverum. They browse their hotel's curated selection. Hotels choose which suppliers to feature.
- **Supplier self-service.** Suppliers manage their own experiences, sessions, pricing, and bookings. No Traverum staff involvement in day-to-day operations.
- **Hotel zero-effort.** Hotels embed once, toggle experiences on/off, and earn. No booking management, no customer service.
- **Location-based matching.** Hotels see experiences within a configurable radius (PostGIS). Suppliers operating in multiple areas create separate experiences.

## Reference

- Cursor rule: `.cursor/rules/product-vision.mdc`
- Glossary: `docs/technical/glossary.md`
- Account scenarios: `docs/technical/account-scenarios.md`
