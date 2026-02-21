# Experience List (Guest Browse)

## Purpose

**Route:** `/{hotelSlug}`

This is the first thing the guest sees. A grid of experiences offered through the hotel. The goal is simple: get the guest excited and clicking.

The page should feel like the hotel curated these experiences for them — not like a marketplace listing. No prices on cards (discovery first, commitment later). The entire card is clickable. Clean, visual, inviting.

In section embed mode, this shows as a native-looking section on the hotel's own website with a "See all experiences" link.

## Key decisions

- Hotel logo + name in header (full-page mode only, links to hotel website)
- Configurable title/subtitle (supports `{{hotel_name}}` placeholder), can be hidden
- Category filter tabs from experience tags (full-page only)
- 3-column card grid (1 on mobile). Cards show cover image + title overlay. No price on cards.
- Section embed mode (`?embed=section`): no header, resize script posts height to parent for iframe auto-sizing

## Reference

- Cursor rule: `.cursor/rules/widget-conventions.mdc`
- Code: `apps/widget/src/app/[hotelSlug]/page.tsx`
