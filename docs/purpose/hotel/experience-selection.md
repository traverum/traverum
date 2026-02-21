# Hotel Experience Selection

## Purpose

**Route:** `/hotel/experiences`

Hotels need to see what experiences are available near their property, choose which ones to offer to their guests, and add them to their widget.

This should feel like curating a menu — not building a platform. The hotel browses, toggles experiences on/off, and they appear in the widget. Zero operational effort.

## Key decisions

- Show experiences within a configurable radius (PostGIS location matching)
- Hotels can toggle experiences on/off for their widget
- Distance shown for each experience (e.g., "2.5 km away")
- Each hotel property (`hotel_config`) has its own selection — multi-property hotels can curate differently per location
- Experiences from both external suppliers and the hotel's own experiences (if they are also a supplier) appear in the same list

## Reference

- Vision: `docs/purpose/vision.md` (hotel = zero effort)
- Account scenarios: `docs/technical/account-scenarios.md`
- Location system: `docs/technical/systems/location-system.md`
