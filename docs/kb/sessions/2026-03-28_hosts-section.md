# 2026-03-28_hosts-section

## Goal
Add a "Hosts" section to the Veyond direct and hotel widget listing pages — showing the people behind the experiences to build trust and make pages more human.

## Blast Radius
- Migration is additive only (new nullable columns + boolean default). No existing queries break.
- No existing UI changes — the Hosts section is purely additive.
- No booking flow impact — read-only/display feature.
- Opt-in by default — `profile_visible = false` means zero disruption.

## Done
- [x] Migration `20260328120000_add_partner_profiles.sql` — adds `display_name`, `bio`, `avatar_url`, `profile_visible`, `partner_slug` to `partners` table. Applied to staging via Supabase MCP.
- [x] Supabase types updated in both `apps/widget` and `apps/dashboard`.
- [x] Data fetching: `getVisibleHosts()` and `getHostBySlug()` in `apps/widget/src/lib/hotels.ts`.
- [x] Extracted `ScrollRow` from `NetflixLayout` into reusable `apps/widget/src/components/ScrollRow.tsx`.
- [x] `NetflixLayout` refactored to use shared `ScrollRow`.
- [x] `HostCard` component — circular avatar with initials fallback, serif name, city subtitle.
- [x] `HostsSection` (server) + `HostsSectionClient` (client) — renders nothing if no visible hosts.
- [x] Integrated into Veyond direct (`/experiences`) and hotel widget (`/[hotelSlug]`) listing pages as bottom section.
- [x] Host detail pages for both channels: `/experiences/hosts/[hostSlug]` and `/[hotelSlug]/hosts/[hostSlug]`.
- [x] Dashboard Settings: "Host profile" card with display name, bio, avatar upload, URL slug, visibility toggle.
- [x] `AvatarUploader` component for dashboard (`partners/{partner_id}/avatar.{ext}` in Supabase storage).
- [x] Improved error handling in profile save — surfaces real Supabase error, detects zero-row updates.
- [x] Staging test data: "Experience Company" partner configured as host "Marco" with slug `marco`, profile visible, 12 active experiences.

## Decisions
- **Option A chosen**: profile fields on `partners` table (not a separate table or on `users`). One partner = one host face. Simplest for v1; can extract to `partner_profiles` later if multi-person needed.
- **Section label**: "Hosts" (not Partners, Locals, etc.)
- **Always visible**: no hotel-level toggle — if a partner has `profile_visible = true`, they appear.
- **Both channels at once**: Veyond direct and hotel widget ship together.
- **Position**: Hosts section renders as the bottom-most section on listing pages (after experience rows).

## Open Items
- [ ] **Hosts section — production rollout:** (1) Apply migration `20260328120000_add_partner_profiles` on production. (2) Deploy dashboard so suppliers can set up their profiles. (3) Deploy widget. (4) Suppliers enable their profiles via Settings.
- [ ] **Avatar photos**: No avatar uploaded yet for staging test host "Marco" — can be done via dashboard Settings.

## Notes
- The `partner_slug` has a partial unique index (only non-null values) to allow multiple partners with no slug set.
- The dashboard save was initially failing with a generic error because the migration hadn't been applied — improved error handling now surfaces the real message.
