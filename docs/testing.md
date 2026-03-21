# Test Coverage

Last updated: 2026-03-21 (system setup)

## Unit Tests (Vitest) — 328 tests

### Widget (`apps/widget/src/lib/`) — 262 tests

| Module | File | Tests | Covers |
|--------|------|-------|--------|
| Reservation rules | `reservation-rules.test.ts` | 37 | Field validation, participants, rental request, price match, rental end date, time normalization, auto-distribution rates |
| Availability | `availability.test.ts` | 36 | `isDateAvailable`, operating hours, time slots, cancellation policy text, `canGuestCancel` |
| Utils | `utils.test.ts` | 36 | `formatPrice`, `formatDuration`, `formatDate`, `formatTime`, `darkenColor`, `lightenColor`, `getEmbedMode`, `truncate` |
| Sanitize | `sanitize.test.ts` | 27 | `stripHtml`, `escapeHtml`, `sanitizeGuestText`, `sanitizeGuestEmail`, XSS prevention, truncation |
| Booking rules | `booking-rules.test.ts` | 27 | Commission resolution, experience date resolution, rental days from dates, booking record assembly, split integrity |
| Cron rules | `cron-rules.test.ts` | 25 | `shouldAutoComplete`, `shouldExpirePending`, `shouldExpireUnpaid`, `isCompletionCheckDue`, `resolveBookingExperienceDate` |
| Pricing | `pricing.test.ts` | 21 | `calculatePrice` (all 4 types), session override, `getPriceDisplay`, `getDisplayPrice` |
| Tokens | `tokens.test.ts` | 17 | `signToken`/`verifyToken`, accept/decline/cancel/complete/no-experience tokens |
| Commission | `commission.test.ts` | 14 | `calculateCommissionSplit` (hotel 80/12/8, direct 92/0/8, rounding), `getDefaultCommissionRates` |
| Date utils | `date-utils.test.ts` | 9 | `getTodayLocal`, `parseLocalDate` (local midnight, no UTC shift) |
| Sessions | `sessions.test.ts` | 8 | `groupSessionsByDate`, `getAvailableDates` |
| Rate limit | `rate-limit.test.ts` | 5 | `getClientIp` from x-forwarded-for, comma-separated, anonymous, IPv6 |

### Dashboard (`apps/dashboard/src/lib/`) — 45 tests

| Module | File | Tests | Covers |
|--------|------|-------|--------|
| Pricing | `pricing.test.ts` | 29 | `getUnitLabel`, `getDefaultUnitPrice`, `formatPrice`, `calculateTotalPrice` (all pricing types), `getPricingSummary` |
| Date utils | `date-utils.test.ts` | 16 | `getTodayLocal`, `parseLocalDate`, `isSessionUpcoming`, `isBookingEnded` (sessions + rentals) |

### Shared (`packages/shared/src/`) — 21 tests

| Module | File | Tests | Covers |
|--------|------|-------|--------|
| Constants | `constants.test.ts` | 21 | Commission constants, currency, `formatPrice`, booking statuses, payment deadline, experience categories |

## GitHub Actions

The **Test** workflow (`.github/workflows/test.yml`) runs `pnpm test:unit` (Vitest only, no Playwright) on every push/PR to `main`. No secrets are required — unit tests are pure logic with no external dependencies.

Playwright E2E tests run locally via the `/test` command before deploying. They require a live Supabase instance and Stripe key, which are configured in `apps/e2e/.env`.

## E2E Tests (Playwright) — 6 tests

| Test | Type | Journey covered |
|------|------|-----------------|
| `session-booking.spec.ts` | UI | guest/discover → guest/book → guest/checkout-and-pay (session path) |
| `request-booking.spec.ts` | UI | guest/discover → guest/book → guest/checkout-and-pay (request path) |
| `create-reservation.spec.ts` | API | system/booking-flow — reservation creation + validation |
| `dashboard-auth.spec.ts` | API | Auth guard — 401 without/with invalid token (negative only) |

## Gaps

| Product Journey | Doc | What's missing |
|-----------------|-----|----------------|
| supplier/handle-bookings | `docs/product/supplier/handle-bookings.md` | No tests for accept/decline → payment link creation |
| supplier/get-paid | `docs/product/supplier/get-paid.md` | No tests for auto-complete → Stripe transfer |
| guest/track-reservation | `docs/product/guest/track-reservation.md` | No E2E for reservation status page |
| system/communication | `docs/product/system/communication.md` | No email template output tests |
| hotel/curate-experiences | `docs/product/hotel/curate-experiences.md` | No tests for experience toggle on/off |
| system/embed | `docs/product/system/embed.md` | No tests for embed script or Shadow DOM |
| Admin app | `docs/product/platform/_overview.md` | No tests at all |
| Dashboard UI | — | No component tests for any dashboard pages |
