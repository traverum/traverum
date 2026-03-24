# Active State

Last updated: 2026-03-23

## Recently Done

- [x] Receptionist `BookingPanel` UI pass: guest preview → Veyond direct URL, location/contact/details/booking hierarchy, inset cards, light header rule, `ParticipantSelector.labelClassName`
- [x] Receptionist login: deterministic `user_partners` resolution when user has multiple memberships (`getReceptionistContext` in `apps/widget/src/lib/receptionist/auth.ts`)
- [x] Phase 2 Tier 1: reservation-rules, booking-rules, cron-rules — 262 unit tests
- [x] Phase 3: Playwright E2E setup — 4 tests (2 UI golden paths, 2 API guards)
- [x] Experience detail page UI restructure (hybrid layout, tabs, booking section)
- [x] Hotel widget 404 fix: DB migration for FK names + missing partners columns
- [x] Staging schema sync migration (`20260321100000_sync_fk_names_and_missing_columns.sql`)
- [x] GitHub Actions E2E workflow (`.github/workflows/e2e.yml`)

## Known Issues

- Staging DB may drift from production schema (`sort_order` fallback in `hotels.ts`)
- Placeholder highlights/included/not-included shown for all experiences (no DB columns yet)

## Open Items

- [ ] (Optional) Document receptionist multi-partner context resolution under product receptionist docs if we want parity with `docs/memory/tech-context.md` § 2026-03-21

## Latest Session

[2026-03-23_receptionist-booking-panel-ui](sessions/2026-03-23_receptionist-booking-panel-ui.md)
