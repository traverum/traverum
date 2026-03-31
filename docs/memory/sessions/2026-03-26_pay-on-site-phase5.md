# 2026-03-26_pay-on-site-phase5

## Goal
Build Phase 5 — Attendance Verification for the Reserve & Pay on Site feature.

## Blast Radius
None. All new code paths only activate for `payment_mode === 'pay_on_site'` bookings. Existing Stripe flow untouched.

## Done
- Modified both no-experience routes (token-based + dashboard) to create an `attendance_verifications` record instead of immediately cancelling pay_on_site bookings
- Created `GET /api/attendance/[token]` — guest-facing HTML page ("Did you attend?") with styled "Yes, I Attended" / "No, I Didn't" buttons
- Created `POST /api/attendance/[token]/respond` — resolves the verification:
  - `attended` → outcome = `guest_overridden`, booking marked completed, supplier notified (commission applies)
  - `not_attended` → outcome = `supplier_upheld`, booking cancelled, session released, supplier notified
- Created `/api/cron/attendance-reminder` — daily cron (10:00 UTC) that:
  - Sends reminder email on day 2 (`ATTENDANCE_REMINDER_DAY`)
  - Auto-resolves expired verifications (past `ATTENDANCE_VERIFICATION_DAYS`) as `supplier_upheld`, cancels booking, notifies both parties
- Added 2 email templates: `guestAttendanceVerification`, `guestAttendanceReminder`
- Registered cron in `vercel.json`
- Verification tokens are plain UUIDs stored in `attendance_verifications.verification_token` (DB lookup, no HMAC expiry race conditions)

## Decisions
- Attendance verification uses DB-stored UUID tokens (not HMAC-signed tokens like other email actions) — simpler, no expiry drift, looked up directly in the table
- Guest verification page is a server-rendered HTML page (not a React SPA route) — keeps it lightweight, no JS framework needed for two buttons
- Duplicate verification prevention: both no-experience routes check for existing `outcome = 'pending'` record before creating a new one
- Cron runs at 10:00 UTC (after completion-check at 09:00) so verification emails arrive mid-morning

## Open Items
- [ ] Phase 5 plan todo in `.cursor/plans/reserve_and_pay_on_site_89cde0e1.plan.md` should be marked completed
- [ ] Reserve & Pay on Site Phases 6-7 remain: cancellation enforcement → monthly invoicing

## Notes
- The `attendance_verifications` table was already created in Phase 1 migration with correct schema
- Constants `ATTENDANCE_VERIFICATION_DAYS` (3) and `ATTENDANCE_REMINDER_DAY` (2) already existed in `packages/shared/src/constants.ts` from Phase 1
