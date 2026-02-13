# Experience List

**Route:** `/{hotelSlug}` (e.g. `/hotel-rosa`)

**Purpose:** First page guests see. Grid of experience cards for a hotel so guests can browse and pick something.

- Hotel logo + name in header (full-page mode only, sticky, links to hotel website)
- Configurable title/subtitle (e.g. "Local Experiences", supports `{{hotel_name}}` placeholder). Can be hidden.
- Category filter tabs from experience tags (full-page mode only)
- 3-column card grid (1 on mobile). Cards show cover image + title overlay. No price on cards.
- Entire card clickable → experience detail page

**Section embed mode** (`?embed=section`):
- No header, max 3 cards
- "See all X experiences" button if more exist
- Resize script posts height to parent for iframe auto-sizing
