# Discover Experiences

## Goal

**Route:** `/{hotelSlug}`

This is the first thing the guest sees. A grid of experiences offered through the hotel. The goal is simple: get the guest excited and clicking.

The page should feel like the hotel curated these experiences for them — not like a marketplace listing. No prices on cards (discovery first, commitment later). The entire card is clickable. Clean, visual, inviting.

In section embed mode, this shows as a native-looking section on the hotel's own website with a "See all experiences" link.

## For whom

Guests arriving through a hotel's website or the Veyond direct platform. They're browsing, not yet committed. The experience must feel curated and trustworthy.

## Key stories

- Guest lands on hotel's experience page → sees a beautiful grid of local experiences → clicks one that looks interesting
- Guest uses category filter tabs to narrow down to "Wine & Food" or "Adventure"
- Hotel has the widget embedded on their site → guest sees experiences as a native section, clicks "See all experiences"

## Design decisions

- Hotel logo + name in header (full-page mode only, links to hotel website)
- Configurable title/subtitle (supports `{{hotel_name}}` placeholder), can be hidden
- Category filter tabs from experience tags (full-page only)
- 3-column card grid (1 on mobile). Cards show cover image + title overlay. No price on cards.
- Section embed mode (`?embed=section`): no header, resize script posts height to parent for iframe auto-sizing

## References

- Cursor rule: `.cursor/rules/widget-conventions.mdc`
- Code: `apps/widget/src/app/[hotelSlug]/page.tsx`
