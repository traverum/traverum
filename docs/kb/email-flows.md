---
last_updated: 2026-04-13
compiled_from: sendEmail calls across apps/widget/src/app/api/
---

# Email Flows

All emails sent via Resend from `Veyond <bookings@veyond.eu>`. Templates in `apps/widget/src/lib/email/templates/`.

## Reservation Lifecycle

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Guest creates reservation (request) | Supplier | `New booking request - {title}` / `New rental request - {title}` | `reservations/route.ts` |
| Guest creates reservation (request) | Guest | `Your request has been received - {title}` | `reservations/route.ts` |
| Supplier accepts request (pay-on-site) | Guest | `Your request was accepted! Confirm your reservation - {title}` | `reservations/[id]/accept/route.ts`, `dashboard/requests/[id]/accept/route.ts` |
| Supplier accepts request (Stripe) | Guest | `Your booking is approved! Complete payment - {title}` | `reservations/[id]/accept/route.ts`, `dashboard/requests/[id]/accept/route.ts` |
| Supplier declines request | Guest | `Booking update - {title}` | `dashboard/requests/[id]/decline/route.ts` |

## Booking Confirmation

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Payment succeeds (Stripe webhook) | Guest + Supplier + Hotel | Batch: booking confirmation emails | `webhooks/stripe/route.ts` |
| Card guarantee confirmed (pay-on-site) | Guest + Supplier + Hotel | Batch: pay-on-site confirmation emails | `reservations/[id]/confirm-guarantee/route.ts` |
| Receptionist creates manual booking | Guest + Supplier | Batch: manual booking confirmation | `bookings/manual-create/route.ts` |

## Cancellation

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Guest cancels (Stripe, within policy) | Guest | `Cancellation confirmed - {title}` (with refund info) | `bookings/[id]/cancel/route.ts` |
| Guest cancels (pay-on-site, within policy) | Guest | `Cancellation confirmed - {title}` (free, template: `guestCancelledFreePayOnSite`) | `bookings/[id]/cancel/route.ts` |
| Guest cancels (pay-on-site, late, charge succeeds) | Guest | `Cancellation confirmed - {title}` (charged, template: `guestLateCancellationCharged`) | `bookings/[id]/cancel/route.ts` |
| Guest cancels (pay-on-site, late, charge fails) | Guest | `Cancellation confirmed - {title}` (template: `guestCancellationChargeFailed`) | `bookings/[id]/cancel/route.ts` |
| Any guest cancellation | Supplier | `Booking cancelled by guest - {title}` | `bookings/[id]/cancel/route.ts` |

## Completion & Payout

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Supplier marks complete (Stripe) | Supplier | `Payment transferred - {title}` | `bookings/[id]/complete/route.ts` |
| Supplier marks complete (pay-on-site) | Supplier | `Experience completed - {title}` (no transfer) | `bookings/[id]/complete/route.ts` |
| Auto-complete cron (Stripe) | Supplier | `Payment transferred - {title}` | `cron/auto-complete/route.ts` |
| Auto-complete cron (pay-on-site) | Supplier | `Experience auto-completed - {title}` | `cron/auto-complete/route.ts` |
| Completion check cron | Supplier | `Did the experience happen? - {title}` | `cron/completion-check/route.ts` |

## No-Show & Attendance Verification (pay-on-site only)

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Supplier reports no-show (pay-on-site) | Guest | `Did you attend {title}?` (verification link, template: `guestAttendanceVerification`) | `bookings/[id]/no-experience/route.ts` |
| Supplier reports no-show (Stripe) | Guest | `Refund processed - {title}` | `bookings/[id]/no-experience/route.ts` |
| Attendance reminder (day 2) | Guest | `Reminder: Did you attend {title}?` (template: `guestAttendanceReminder`) | `cron/attendance-reminder/route.ts` |
| Guest confirms attendance | Supplier | `Guest confirmed attendance - {title}` | `attendance/[token]/respond/route.ts` |
| Guest confirms no attendance | Supplier | `Guest confirmed no attendance - {title}` | `attendance/[token]/respond/route.ts` |
| No-show charge succeeds (guest responds or auto-resolve) | Guest | `No-show fee charged - {title}` (template: `guestNoShowCharged`) | `attendance/[token]/respond/route.ts`, `cron/attendance-reminder/route.ts` |
| No-show charge fails | Guest | `Booking cancelled - {title}` (template: `guestCancellationChargeFailed`) | `attendance/[token]/respond/route.ts`, `cron/attendance-reminder/route.ts` |
| Auto-resolve no-show (day 3, no response) | Guest | `Booking cancelled - {title}` | `cron/attendance-reminder/route.ts` |
| No-show confirmed (charge success) | Supplier | `No-show confirmed - {title}` | `cron/attendance-reminder/route.ts` |

## Expiration

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Reservation expired (no supplier response) | Guest | `Booking request expired - {title}` | `cron/expire-reservations/route.ts` |
| Payment window expired (approved, not paid) | Guest | `Payment window closed - {title}` | `cron/expire-reservations/route.ts`, `cron/expire-unpaid/route.ts` |
| Unpaid expiry | Supplier | `Guest did not complete payment - {title}` | `cron/expire-unpaid/route.ts` |

## Payment & Stripe

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Payment failed (Stripe webhook) | Guest | `Payment failed - {title}` | `webhooks/stripe/route.ts` |
| Refund processed (Stripe webhook) | Guest | `Refund processed - {title}` | `webhooks/stripe/route.ts` |
| Stripe account update | Admin | `Stripe account {verified/needs attention} - {partner}` | `webhooks/stripe/route.ts` |
| Stripe transfer complete | Supplier | `Payment sent - {title}` | `webhooks/stripe/route.ts` |
| Stripe account deauthorized | Admin | Account disconnected notification | `webhooks/stripe/route.ts` |

## Commission & Invoicing

| Trigger | Recipient | Subject | Source |
|---|---|---|---|
| Monthly invoice generated | Supplier (pay-on-site) | `Commission invoice - {period}` (template: `partnerCommissionInvoice`) | `cron/generate-invoices/route.ts` |

## Key Email Templates

Located in `apps/widget/src/lib/email/templates/`:
- `baseTemplate` — Wrapper with Veyond header/footer
- `guestAttendanceVerification` — Asks guest to confirm attendance
- `guestAttendanceReminder` — Day-2 reminder for attendance check
- `guestNoShowCharged` — No-show fee charged notification
- `guestCancellationChargeFailed` — Charge failed, booking cancelled
- `guestLateCancellationCharged` — Late cancellation fee charged
- `guestCancelledFreePayOnSite` — Free cancellation (within policy)
- `partnerCommissionInvoice` — Monthly commission invoice
