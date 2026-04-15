# Curate Experiences

## Goal

**Route:** `/hotel/experiences`

Hotels need to see what experiences are available near their property, choose which ones to offer to their guests, and add them to their widget.

This should feel like curating a menu — not building a platform. The hotel browses, toggles experiences on/off, and they appear in the widget. Zero operational effort.

## For whom

Hotel managers or owners selecting which experiences appear on their widget. They want this to be a 5-minute task, not an ongoing project.

## Key stories

- Hotel opens experience list → sees nearby experiences sorted by distance → toggles a few on → they appear in the widget immediately
- Hotel has multiple properties → each property has its own selection, curated independently
- Hotel is also a supplier → their own experiences appear in the same list alongside external ones

## Design decisions

- Show experiences within a configurable radius (PostGIS location matching)
- Hotels can toggle experiences on/off for their widget
- Distance shown for each experience (e.g., "2.5 km away")
- Each hotel property (`hotel_config`) has its own selection — multi-property hotels can curate differently per location
- Experiences from both external suppliers and the hotel's own experiences (if they are also a supplier) appear in the same list

## References

- Vision: `docs/product/vision.md`
- Channels: `docs/product/system/channels.md`
