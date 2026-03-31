# 2026-03-28_experience-search-filters

## Goal
Add search bar and availability filters (date, time of day, people) to the full experience listing pages (hotel widget + Veyond direct). Session-based experiences are filtered by actual session availability; request-based experiences are always shown with an "On Request" badge.

## Blast Radius
- Hotel widget full page (`[hotelSlug]/page.tsx`) — new client wrapper replaces direct `CategoryAnchorSection + NetflixLayout`
- Veyond direct listing (`experiences/page.tsx`) — same treatment
- `ExperienceCard` — new optional `showRequestBadge` prop (additive, no breaking change)
- `hotels.ts` — new `getSessionCalendar()` export (additive)
- Section embed mode is completely unaffected
- No database changes

## Done
- Added `getSessionCalendar()` to `hotels.ts` — lightweight fetch of future available sessions (`experience_id`, `session_date`, `start_time`, `spots_available`)
- Created `SearchFilterBar.tsx` — search input (matches title + tag labels), horizontally scrollable tag pills, expandable filter panel (date picker, Morning/Afternoon/Evening time buckets, people stepper with +/-)
- Created `FilterableExperienceBrowser.tsx` — client wrapper managing all filter state; renders Netflix carousels when no filters are active, switches to filtered grid when any filter is applied
- Updated hotel widget page — fetches session calendar, uses `FilterableExperienceBrowser` in full mode
- Updated Veyond direct page — same treatment
- Added `showRequestBadge` prop to `ExperienceCard` — frosted-glass "On Request" pill badge next to duration badge
- Removed `CategoryAnchorSection` ("Explore by interest") from `FilterableExperienceBrowser` — was redundant with tag pills in the search bar. **To restore:** re-import `CategoryAnchorSection` and render it before `<NetflixLayout>` in the no-filters branch of `FilterableExperienceBrowser.tsx`
- Fixed tag pills to always render as a single horizontally scrollable row (removed `sm:flex-wrap`)

## Decisions
- Filters use time-of-day *buckets* (Morning < 12, Afternoon 12-17, Evening 17+) instead of specific time pickers — better for browsing/discovery context
- Request-based experiences always pass date/time filters (they accept any date) — guests see "On Request" badge to understand the difference
- People filter uses `min_participants <= n <= max_participants` as a hard filter for all experience types
- Layout switches from Netflix carousels to flat grid when any filter is active; transitions back when all cleared
- Search matches against experience `title` and tag label text (case-insensitive)
- "Explore by interest" (CategoryAnchorSection) removed from FilterableExperienceBrowser for now — tag pills in SearchFilterBar serve the same purpose with less visual weight

## Open Items
- [ ] Visual QA on both hotel widget and Veyond pages with real data
- [ ] Consider re-adding CategoryAnchorSection as a standalone element outside the filterable browser if desired later
- [ ] Test date/time filter behavior with real session data on staging

## Notes
- CategoryAnchorSection was using `CategoryAnchorCard` components with art images from `public/category-anchors/{tagId}.svg` and scrolling to `#tag-{tagId}` sections. The `CategoryAnchorSection` component itself is untouched and can be re-added at any time.
- The `ExperienceListClient` component (used for section embed mode) is unaffected — it has its own tag pill implementation
