# 2026-03-26_pay-on-site-phase1

## Goal
Implement Phase 1 of Reserve & Pay on Site: database migration, type regeneration, shared constants. Zero blast radius — all additive.

## Blast Radius
None. Additive columns with defaults, new empty tables. No existing code paths affected.

## Done
- Migration `20260326120000_pay_on_site_schema.sql` written and applied to staging
- New columns: `partners.payment_mode`, `reservations.stripe_setup_intent_id` + `stripe_customer_id`, `bookings.payment_mode`
- New tables: `commission_invoices`, `attendance_verifications`, `cancellation_charges` — all with RLS + CHECK constraints
- Types regenerated from staging DB via `generate_typescript_types` MCP
- Convenience type aliases restored + 3 new ones added (`AttendanceVerification`, `CancellationCharge`, `CommissionInvoice`)
- Dashboard types manually synced with same additions
- Shared constants added to `packages/shared/src/constants.ts`: `PAYMENT_MODES`, `ATTENDANCE_VERIFICATION_DAYS`, `ATTENDANCE_REMINDER_DAY`, `INVOICE_STATUSES` + TypeScript types
- Widget typecheck: zero new errors (all pre-existing)

## Decisions
- CHECK constraints added on `payment_mode` columns (`'stripe'` | `'pay_on_site'`) and status columns for data integrity
- RLS on new tables uses `get_user_partner_ids()` pattern — `commission_invoices` directly via `partner_id`, `attendance_verifications` and `cancellation_charges` via booking → reservation → experience → partner join chain
- Logged to tech-context: never overwrite types.ts without re-appending convenience aliases

## Open Items
- [ ] Phase 2: Stripe helper functions, reservation API branching, confirm-guarantee endpoint, email templates
- [ ] Phase 1 migration not yet applied to production (staging only)

## Notes
- Supabase MCP (`user-supabase-staging`) is available via `C:\Users\elias\.cursor\projects\c-Traverum-traverum-v1\mcps\user-supabase-staging\tools\`
- Dashboard has no `typecheck` script — types are manually synced
