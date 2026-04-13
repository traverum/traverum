---
last_updated: 2026-04-13
compiled_from: apps/widget/src/app/api/
---

# API Routes Reference

All mutations go through the widget API (`apps/widget/src/app/api/`). Dashboard and Admin never mutate Supabase directly.

## Reservation & Booking (Public/Token-based)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/reservations` | None | Create a new reservation (guest checkout) |
| GET/POST | `/api/reservations/[id]/accept` | Token | Supplier accepts a request (GET = email link, POST = dashboard) |
| GET/POST | `/api/reservations/[id]/decline` | Token | Supplier declines a request |
| POST | `/api/reservations/[id]/setup-intent` | None | Create Stripe SetupIntent for pay-on-site card guarantee |
| POST | `/api/reservations/[id]/confirm-guarantee` | None | Confirm booking after successful card guarantee |
| GET | `/api/bookings/[id]/cancel` | Token | Guest cancels booking (email link). Branches: Stripe refund vs pay-on-site charge |
| GET | `/api/bookings/[id]/complete` | Token | Supplier confirms experience happened (email link) |
| GET | `/api/bookings/[id]/no-experience` | Token | Supplier reports no-show. Pay-on-site: creates attendance verification |
| POST | `/api/bookings/manual-create` | User JWT | Receptionist creates booking on behalf of guest |

## Dashboard Routes (Supplier/Hotel)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/dashboard/requests/[id]/accept` | User JWT | Supplier accepts request (from dashboard UI) |
| POST | `/api/dashboard/requests/[id]/decline` | User JWT | Supplier declines request |
| POST | `/api/dashboard/bookings/[id]/cancel` | User JWT | Cancel booking from dashboard |
| POST | `/api/dashboard/bookings/[id]/complete` | User JWT | Mark booking complete from dashboard |
| POST | `/api/dashboard/bookings/[id]/no-experience` | User JWT | Report no-show from dashboard |
| GET | `/api/dashboard/experiences` | User JWT | List experiences for current user's partners |
| POST | `/api/dashboard/distributions` | User JWT | Create/update distribution (hotel selects experience) |
| POST | `/api/dashboard/logout` | None | Clear session cookies |

## Admin Routes (Superadmin)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/analytics` | Superadmin | Platform-wide analytics |
| GET | `/api/admin/stats` | Superadmin | Dashboard stats summary |
| GET | `/api/admin/commission-invoices` | Superadmin | List all commission invoices |
| PATCH | `/api/admin/commission-invoices/[id]` | Superadmin | Update invoice status (mark paid/revert) |
| GET/POST | `/api/admin/hotel-payouts` | Superadmin | List/create hotel payouts |
| GET | `/api/admin/hotel-payouts/pending` | Superadmin | List pending hotel payouts |
| PATCH/DELETE | `/api/admin/hotel-payouts/[id]` | Superadmin | Update/delete hotel payout |
| GET | `/api/admin/partners/[partnerId]/analytics` | Superadmin | Per-partner analytics |
| GET | `/api/admin/partners/[partnerId]/summary` | Superadmin | Partner summary (bookings, revenue) |
| GET | `/api/admin/partners/[partnerId]/payouts` | Superadmin | Partner payout history |
| GET | `/api/admin/partners/[partnerId]/payment-log` | Superadmin | Partner payment log |
| GET | `/api/admin/partners/[partnerId]/distributions` | Superadmin | Partner distributions |
| PATCH | `/api/admin/partners/[partnerId]/distributions/[id]` | Superadmin | Update distribution |
| GET | `/api/admin/support-feedback` | Superadmin | List support tickets |
| GET/PATCH | `/api/admin/support-feedback/[id]` | Superadmin | View/update support ticket |

## Cron Routes

All cron routes require `Authorization: Bearer <CRON_SECRET>`. Support both GET and POST (Vercel sends GET).

| Method | Path | Schedule | Purpose |
|---|---|---|---|
| GET/POST | `/api/cron/auto-complete` | Daily 02:00 UTC | Complete bookings 7+ days after experience. Transfers funds (Stripe) or logs commission (pay-on-site) |
| GET/POST | `/api/cron/completion-check` | Daily 09:00 UTC | Send "did it happen?" email to supplier after experience ends |
| GET/POST | `/api/cron/expire-unpaid` | Daily 03:00 UTC | Expire reservations where payment deadline passed |
| GET/POST | `/api/cron/expire-reservations` | Daily 04:00 UTC | Expire pending/approved reservations past response/payment deadline |
| GET/POST | `/api/cron/sync-divinea` | Daily 05:00 UTC | Sync availability from DiVinea Wine Suite API |
| GET/POST | `/api/cron/attendance-reminder` | Daily 10:00 UTC | Day-2 reminders + day-3 auto-resolve for attendance verifications |
| GET/POST | `/api/cron/generate-invoices` | Monthly 1st, 06:00 UTC | Generate commission invoices for pay-on-site suppliers |

## Attendance Verification (Token-based)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/attendance/[token]` | Token | Guest views attendance verification page |
| POST | `/api/attendance/[token]/respond` | Token | Guest responds (attended/did not attend) |

## Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/auth/callback` | None | Supabase Auth OAuth callback |
| POST | `/api/auth/verify-recaptcha` | None | Verify reCAPTCHA token for dashboard signup |

## Organization Management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/DELETE | `/api/organizations/[partnerId]/members` | User JWT | List/remove team members |
| POST | `/api/organizations/[partnerId]/invitations` | User JWT | Create invitation link |
| GET/POST | `/api/invitations/[token]` | None/Token | View/accept invitation |

## Embed & Widget

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/embed/[hotelSlug]` | None | Serve widget config/data for hotel embed |

## Other

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/analytics/track` | None | Track widget analytics events |
| POST | `/api/translate` | None | AI-translate experience content (OpenAI) |
| POST | `/api/support` | None | Submit support/feedback message |
| POST | `/api/webhooks/stripe` | Stripe signature | Handle Stripe webhook events |
| GET | `/api/divinea/test-availability` | User JWT | Test DiVinea API availability |
| POST | `/api/receptionist/logout` | None | Clear receptionist session |

## Edge Functions (Supabase, separate from widget)

| Function | Path | Auth | Purpose |
|---|---|---|---|
| `create-connect-account` | Supabase Edge | Bearer JWT | Create/retrieve Stripe Connect account for supplier |
| `stripe-webhooks` | Supabase Edge | Stripe signature | Handle Stripe account.updated and deauthorization events |
