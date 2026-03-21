# Active State

Last updated: 2026-03-21

## Recently Done

- [x] Phase 2 Tier 1: reservation-rules, booking-rules, cron-rules — 262 unit tests
- [x] Phase 3: Playwright E2E setup — 4 tests (2 UI golden paths, 2 API guards)
- [x] Experience detail page UI restructure (hybrid layout, tabs, booking section)
- [x] Hotel widget 404 fix: DB migration for FK names + missing partners columns
- [x] Staging schema sync migration (`20260321100000_sync_fk_names_and_missing_columns.sql`)
- [x] GitHub Actions E2E workflow (`.github/workflows/e2e.yml`)

## Known Issues

- Staging DB may drift from production schema (`sort_order` fallback in `hotels.ts`)
- Placeholder highlights/included/not-included shown for all experiences (no DB columns yet)

## Latest Session

[2026-03-20_testing](sessions/2026-03-20_testing.md)
