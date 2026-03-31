# 2026-03-26_pay-on-site-phase6

## Goal
Phase 6: Cancellation enforcement — off-session charging for late cancellations and no-shows (pay_on_site bookings only).

## Blast Radius
Low. All changes gated on `payment_mode === 'pay_on_site'`. Stripe flow in guest cancel route isolated into its own function. No changes to dashboard supplier-cancel route (already correct). No schema changes needed (tables exist from Phase 1 migration).

## Done
- Created `apps/widget/src/lib/cancellation-charges.ts` — shared helper: retrieves payment method from SetupIntent → calls `chargeOffSession` → writes `cancellation_charges` record. Used by all three charge triggers.
- Modified guest cancel route (`apps/widget/src/app/api/bookings/[id]/cancel/route.ts`): refactored into `handlePayOnSiteCancellation` and `handleStripeCancellation`. Pay on site + within policy = free cancel. Pay on site + outside policy = charge saved card. Failed charge = cancel anyway, log failure.
- Modified attendance respond route (`apps/widget/src/app/api/attendance/[token]/respond/route.ts`): guest "not_attended" response now charges saved card for no-show.
- Modified attendance cron (`apps/widget/src/app/api/cron/attendance-reminder/route.ts`): auto-resolve (deadline expired) now charges saved card. Expanded booking query to include financial fields.
- Added 4 email templates: `guestLateCancellationCharged`, `guestNoShowCharged`, `guestCancellationChargeFailed`, `guestCancelledFreePayOnSite`.
- TypeScript compilation verified — zero new errors.

## Decisions
- Cancellation charge amount = full experience price (`booking.amount_cents`), matching the booking-flow.md spec.
- Commission split on cancellation charges mirrors the original booking split (stored in `commission_split_cents` JSONB on `cancellation_charges`).
- Failed charges don't block cancellation — booking is always cancelled. Failed charges fall back to monthly invoice (Phase 7).
- Missing Stripe data (no setup_intent_id or customer_id) is logged but doesn't crash — booking cancelled without charge.
- `canGuestCancel()` not modified — pay_on_site branching handled directly in route to keep existing Stripe path untouched.

## Open Items
- [ ] Phase 7: Monthly commission invoicing (cron + dashboard UI) — last phase of pay_on_site feature
- [ ] No SCA recovery flow for `authentication_required` off-session failures (logged as failed, falls to invoice)

## Notes
- Dashboard supplier-cancel route already handles pay_on_site correctly from Phase 3 (no charge to guest for supplier-initiated cancellation).
- The `cancellation_charges` table, `chargeOffSession()`, and `getPaymentMethodFromSetupIntent()` all existed from Phases 1-2. Phase 6 wired them together.
