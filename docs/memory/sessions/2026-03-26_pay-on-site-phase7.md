# 2026-03-26_pay-on-site-phase7

## Goal
Build Phase 7 (final phase) of Reserve & Pay on Site: monthly commission invoicing cron + dashboard UI for both supplier and admin.

## Blast Radius
None. All new code. Only processes `pay_on_site` data. No existing flows touched.

## Done
- [x] Cron job `POST /api/cron/generate-invoices` — runs 1st of each month at 06:00 UTC. For each pay_on_site partner: sums completed bookings' commission (platform + hotel share), subtracts cancellation credits (supplier's share of charges Traverum collected), creates `commission_invoices` record, sends invoice email. Idempotent (skips duplicate period + partner).
- [x] Email template `partnerCommissionInvoice()` — period, booking count, total value, commission, credits, net amount.
- [x] Admin API: `GET /api/admin/commission-invoices` (list with partner names, status/partner filters), `PATCH /api/admin/commission-invoices/[id]` (mark paid, revert, edit).
- [x] Supplier dashboard page `/supplier/invoices` — summary cards (outstanding / paid), invoice table with period, commission, credits, net, status, date. Empty state for no invoices.
- [x] Admin dashboard page `/invoices` — summary cards (pending collection / collected / total count), filterable table with search + status filter, mark paid dialog, revert action. Follows hotel payouts page pattern.
- [x] Sidebar: "Invoices" link with `DocumentTextIcon` in Experiences section after Analytics.
- [x] Admin nav: "Invoices" item with `Receipt` icon between Partners and Support.
- [x] `vercel.json` cron entry: `0 6 1 * *`.
- [x] Plan file updated: all 7 phases marked completed.

## Decisions
- Invoice cron schedule: `0 6 1 * *` (1st of month, 06:00 UTC) — early morning so invoices arrive at start of business day in Europe
- Invoice status set to `sent` immediately (not `draft` then `sent`) — keeps it simple, one step
- Invoices link always visible in sidebar (not gated on payment_mode) — KISS, empty state explains when invoices appear
- Net amount clamped to `Math.max(0, ...)` — if cancellation credits exceed commission in a given month, net is zero (not negative)

## Open Items
- [ ] Deploy: Apply Phase 7 to staging/production (no migration needed — `commission_invoices` table already exists from Phase 1)
- [ ] Test: Trigger cron manually on staging with a test pay_on_site partner that has completed bookings
- [ ] Consider: PDF generation for invoices (currently email-only, `pdf_url` column exists but unused)

## Notes
- All 7 phases of Reserve & Pay on Site are now code-complete
- The full feature is gated on `partners.payment_mode = 'pay_on_site'` — zero blast radius until a partner is switched to that mode
