# 2026-03-27_experience-tags

## Goal

Replace single “category” semantics on experiences with multi-select **experience tags**, and make Veyond `/experiences` browse feel like Netflix / major OTAs (horizontal rows per tag).

## Blast Radius

- `experiences.tags` (`text[]`) — reused; no new column. Old slugs remapped via SQL.
- `@traverum/shared`: `EXPERIENCE_TAGS`, `getTagLabel`, `getTagLabels`; deprecated aliases for old names.
- Dashboard: supplier create/edit + hotel experience selection UI.
- Widget: `/experiences` uses `NetflixLayout`; hotel embed still uses `ExperienceListClient` with tag pills.

## Done

- Shared constants: eight canonical tag ids + labels in `packages/shared/src/constants.ts`; tests updated.
- Data migration: `apps/dashboard/supabase/migrations/20260327120000_replace_categories_with_tags.sql` (remap `food`→`food_wine`, etc., dedupe arrays).
- Dashboard: `TagSelector` (multi pill toggle); `ExperienceForm` + `ExperienceDashboard` persist `tags: string[]`; `ExperienceSelection` shows all tags as badges.
- Widget: `NetflixLayout` groups by every tag on an experience; `ExperienceListClient` filters by any matching tag; `experiences/page.tsx` uses `NetflixLayout`.

## Decisions

- **No new DB column** — `tags` already supports multiple values; migration is data-only.
- **Replace old categories everywhere** — user chose full replacement (not parallel systems).
- **Approximate slug mapping** — suppliers may need to re-tag after migration for editorial accuracy.

## Open Items

- [ ] Apply `20260327120000_replace_categories_with_tags.sql` to **staging** then **production** (MCP `apply_migration` or CLI per `DEPLOYMENT.md`).
- [ ] **Deploy order for production:** ship **dashboard** first (multi-tag editor), run **data migration**, then **widget** (Netflix UI expects new slugs). Brief mismatch window is display-only, not booking breakage.
- [ ] Spot-check experiences in dashboard after migration; add tags where the automatic map was wrong.

## Notes

- Deprecated exports: `EXPERIENCE_CATEGORIES` → alias of `EXPERIENCE_TAGS`; `getCategoryIcon` returns empty string.
