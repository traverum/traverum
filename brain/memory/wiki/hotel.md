---
type: entity
created: 2026-04-15
updated: 2026-04-15
sources:
  - hotel/_overview.md
  - hotel/curate-experiences.md
  - system/channels.md
  - system/embed.md
tags: [persona, hotel, widget, embed, white-label, distribution]
---

# Hotel

Hotel owners, general managers, or marketing managers. They want to enhance guest experience and earn revenue but have zero time for operations. They are not in the business of running tours — they just want to offer them.

**App:** Dashboard (`apps/dashboard`)
**Routes:** `/hotel/*`
**Database entity:** `hotel_configs` table

## Promise

Zero effort. Embed a widget once, toggle experiences on/off, earn [[commission]]. The widget looks like the hotel's brand — their colors, fonts, logo. No booking management, no customer service, no operational overhead.

## Success

- Widget embedded in under 5 minutes (copy-paste snippet)
- Relevant experiences appear automatically (distance-based)
- Earns [[commission]] without daily involvement
- [[Guest|Guests]] perceive experiences as curated by the hotel

## Never

- Widget looks foreign or breaks the hotel's website
- Hotel needs to manage bookings or handle guest issues
- Irrelevant experiences appear (wrong location, wrong type)
- Setup requires technical knowledge beyond copy-paste

## Widget embed

See [[channels]] for full technical details. Summary:

- `<veyond-widget hotel="slug">` Web Component with Shadow DOM
- CSS variables for theming
- Embed script at `/embed.js` (~15KB, no React)
- Card click opens booking in new tab
- Legacy `<div id="traverum-widget">` auto-converted

## Journey: Curate experiences — `/hotel/experiences`

The hotel's only operational task. Browse, toggle, done.

- Experiences within configurable radius (PostGIS location matching)
- Toggle on/off for the widget
- Distance shown per experience (e.g. "2.5 km away")
- Each property (`hotel_config`) curates independently — multi-property hotels curate per location
- Hotel's own experiences (if also a [[supplier]]) appear alongside external ones

## [[Commission]] model

Hotel [[channels|channel]] uses three-way split from `distributions` table:
- Default: [[supplier]] 80% / hotel 12% / platform 8%
- Configurable per experience-hotel pair
- Hotel earns passively on every [[booking]] through their widget

## Related pages

- [[channels]] — Hotel channel technical details
- [[commission]] — Three-way split mechanics
- [[guest]] — Guest journey through the hotel widget
- [[receptionist]] — Front-desk staff using the concierge tool
- [[overview]] — Platform context
