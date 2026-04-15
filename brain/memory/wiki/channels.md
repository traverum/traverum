---
type: concept
created: 2026-04-15
updated: 2026-04-15
sources:
  - system/channels.md
  - system/embed.md
  - vision.md
tags: [channel, hotel, veyond, widget, embed, white-label]
---

# Channels

Traverum serves guests through two channels. Both use the same [[booking]] engine, APIs, [[payment-modes|payment flow]], and email templates. The channel determines branding and [[commission]] split — nothing else.

## Hotel channel (white-label)

- **URL:** `book.veyond.eu/{hotelSlug}` or embedded on hotel's website
- **Branding:** Hotel's brand — colors, fonts, logo. Traverum/Veyond invisible (footer only).
- **[[Commission]]:** Three-way split via `distributions` table (default: supplier 80% / hotel 12% / platform 8%)
- **Technical signal:** `reservation.hotel_id` is set
- **Discovery:** Location-based matching via PostGIS radius queries

## Veyond direct channel

- **URL:** `veyond.app` (redirects from `book.veyond.eu/experiences`)
- **Branding:** Veyond brand. No hotel involved.
- **[[Commission]]:** Two-way split (supplier 92% / platform 8%) via `SELF_OWNED_COMMISSION`
- **Technical signal:** `reservation.hotel_id` is null
- **Notifications:** Email to `info@traverum.com` on every direct booking

## Design rule

Channel is determined by presence of `hotel_id`. A reservation with `hotel_id = null` is direct. Same code path, same status transitions, same emails — only branding and [[commission]] differ. No separate booking flows, no channel-specific API routes.

## Widget embed

The hotel channel is delivered via an embeddable widget:

- `<veyond-widget hotel="slug">` Web Component with Shadow DOM
- CSS variables for theming to match hotel branding
- Embed script at `/embed.js` (~15KB, no React)
- Card click opens `book.veyond.eu/{hotelSlug}/{experienceSlug}?returnUrl=...` in new tab
- `returnUrl` from `window.location.href`; fallback to `hotel_configs.website_url`

### Legacy embed

Early hotels got `<div id="traverum-widget">` + `<script data-hotel="slug">`. `embed.js` detects both patterns and auto-converts. Breaking existing embeds on hotel websites is unacceptable.

## Related pages

- [[overview]] — Two channels, one platform
- [[commission]] — Split depends on channel
- [[booking]] — Same flow regardless of channel
- [[hotel]] — Hotel persona and widget curation
