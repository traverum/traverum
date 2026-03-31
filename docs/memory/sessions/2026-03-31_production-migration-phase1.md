# 2026-03-31_production-migration-phase1

## Goal
Merge feature branch `feat/receptionist-tool-finalize` to `main` and prepare for production database migration. First step of moving from staging to production.

## Blast Radius
- All three apps (widget, dashboard, admin) — merged 311 files
- 8 database migrations pending for production
- Existing production partners could be affected by `payment_mode` defaulting to `pay_on_site`

## Done
- [x] Created comprehensive production migration checklist (Phase 0–6)
- [x] Pulled latest `main` into feature branch (already up to date, no conflicts)
- [x] Ran all unit tests: 337 passing (shared 20, dashboard 45, widget 272)
- [x] Scanned diff for secrets, staging URLs, console.logs — clean
- [x] Committed all 311 files as single commit (`b6031db`)
- [x] Pushed branch to origin
- [x] Authenticated `gh` CLI (`traverum` org)
- [x] Created PR #1: https://github.com/traverum/traverum/pull/1
- [x] Fixed all widget typecheck errors (was 200+, now 0):
  - Restored convenience type aliases to `types.ts` (Experience, Booking, Partner, etc.)
  - Changed `ExperienceWithMedia` from `interface extends` to type intersection (`&`)
  - Added type assertions on Supabase queries returning `never`
  - Replaced `Set` spread with `Array.from()` for downlevelIteration compat
  - Added missing `divinea_slot_id` to test fixtures
  - Null-coalesced nullable fields in experience detail pages
  - Fixed React `RefObject` type compat in AvailabilityResults
- [x] Pushed typecheck fix commit (`816d592`)
- [x] Verified Dashboard and Admin Vercel preview builds pass

## Decisions
- **Single commit for feature branch:** Features are deeply intertwined (shared types, components, constants). Splitting into intermediate commits risks non-compiling states. Session docs tell the per-feature history.
- **`ExperienceWithMedia` is now a type intersection (`&`)** instead of `interface extends` — avoids conflicts when Experience Row type has nullable fields that the interface tried to redeclare as optional.
- **Type assertions on Supabase queries** that return `never`: the generated types have empty `Relationships: []` on some tables, causing Supabase client type inference to fail. Runtime behavior is correct; the `as any` + explicit return type pattern is the pragmatic fix until types are regenerated with full relationship declarations.

## Open Items
- [ ] **Verify widget Vercel preview build passes** after typecheck fix push
- [ ] **Merge PR #1 to main** once all checks green
- [ ] **Phase 2: Apply 8 migrations to production** (in order, byte-for-byte from git)
- [ ] **Phase 3: Regenerate types from production** (verify schema match)
- [ ] **Phase 4: Deploy apps** (Dashboard → Widget → Admin)
- [ ] **Phase 5: Post-deploy verification** (booking flow, crons, Stripe webhooks)
- [ ] **CRITICAL: Check `payment_mode` default for existing partners** — existing Stripe partners will get `payment_mode = 'pay_on_site'` default. May need a data migration to set existing partners to `'stripe'` if they have `stripe_onboarding_complete = true`.
- [ ] **DiVinea `sync-divinea` cron** — verify it exits gracefully when env vars are not set on production

## Notes
- PR #1 is the first PR on the Traverum repo
- Vercel Hobby cron limits: only 2 daily crons supported. External cron service (cron-job.org) needed for hourly/sub-hourly jobs.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be set on production Vercel (widget) before deployment
