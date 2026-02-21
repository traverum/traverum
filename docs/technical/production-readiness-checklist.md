# Traverum Production Readiness Checklist

**Purpose:** Every scenario that must work 100% of the time for production-ready software. Grouped by user, sorted by priority.

**Priority levels:**
- **P0 (Blocking):** Core money/booking flow — if broken, no business
- **P1 (Critical):** Users expect it; broken = frustrated users & support load
- **P2 (Important):** Needed for smooth operation; workarounds exist but painful
- **P3 (Nice-to-have):** Improves experience; not strictly required for launch

---

## 1. TRAVELER (GUEST) — Widget & Booking Flow

### P0 — Blocking (must work every time)

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 1 | Browse experiences | Hotel widget / full-page | Experiences load from `/api/embed/{slug}`, themed to hotel, only distributed+active shown |
| 2 | View experience detail | List -> Detail page | Title, description, images, pricing display, availability rules, duration, meeting point, cancellation policy |
| 3 | Session-based booking (instant) | Detail -> Pick session -> Checkout -> Stripe | Select available session, enter name/email/phone, participant selector (1 to max_participants), session claimed (status `booked`), redirect to Stripe Payment Link, pay |
| 4 | Stripe payment success | Stripe Checkout -> Webhook | `checkout.session.completed` or `payment_intent.succeeded` creates booking, idempotent (no duplicate bookings), reservation marked `approved`, booking `confirmed` |
| 5 | Payment confirmation emails | Post-payment | Guest receives confirmation with booking ref, details, cancel link, cancellation policy. Supplier receives guest details notification. |
| 6 | Request-based booking | Detail -> Custom date/time -> Submit | Creates `pending` reservation (48h deadline), supplier receives email with Accept/Decline buttons, guest redirected to reservation status page |
| 7 | Pay after approval | Supplier accepts -> Guest gets Pay Now email -> Stripe | Private session created (not in widget), payment link works (24h deadline), same webhook flow as session-based, booking confirmed |
| 8 | Guest cancellation (within policy window) | Cancel link in confirmation email | Full refund via Stripe, session status -> `available`, both parties emailed, booking `cancelled` |
| 9 | Commission split on payment | Webhook creates booking | `supplier_amount_cents`, `hotel_amount_cents`, `platform_amount_cents` stored correctly per distribution rates (default 80/12/8) |

### P1 — Critical

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 10 | Price calculation correctness | All pricing types | Per-person, flat-rate, base+extra, per-day; min_participants is pricing floor only; session override takes precedence |
| 11 | Availability filtering | Calendar in widget | Unavailable days disabled; operating hours shown; seasonal rules applied; past dates disabled |
| 12 | Reservation status page | `/reservation/{id}` | Guest sees pending / approved / declined / expired status with correct message and action |
| 13 | Payment expired (24h) | Cron: expire-unpaid | `approved` + `payment_deadline` passed + no booking -> `expired`, session -> `available`, guest + supplier emailed |
| 14 | Request expired (48h) | Cron: expire-reservations | `pending`/`proposed` + `response_deadline` passed -> `expired`, guest emailed |
| 15 | Propose new time - guest selects | Supplier proposes -> Email with slots | One-click Select creates private session, approves, sends Pay Now link |
| 16 | Propose new time - guest declines | Email "None work" button | Reservation -> `declined`, supplier notified |

### P2 — Important

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 17 | Embed mode (Shadow DOM) | `<traverum-widget hotel="slug">` | Widget loads inside Shadow DOM, CSS isolation from host page, theme applied, responsive |
| 18 | Full-page mode | `book.traverum.com/{slug}` | Same experience, standalone page, works for QR codes / email links |
| 19 | Theming | Hotel config | Accent color, fonts, spacing, alignment applied correctly per hotel property |
| 20 | Cancel outside policy window | Cancel link | Shows "Non-refundable" or "Window closed" message gracefully, doesn't allow refund |
| 21 | Demo mode | `hotel-traverum` | Checkout simulates success without real Stripe call |
| 22 | Cancellation policy display | Experience detail + confirmation email | Policy text from database shown (flexible/moderate/strict/non_refundable), cancel button conditional |

### P3 — Nice-to-have

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 23 | Stripe receipt | Automatic | Stripe sends receipt (enabled in Stripe Dashboard settings) |
| 24 | Responsive / mobile UX | Bottom sheet, sticky bar, participant selector | Full mobile booking flow works end-to-end |
| 25 | Image gallery | Detail page | Gallery opens, swipe/navigate, close; no hydration errors (inline SVGs, no lucide-react) |
| 26 | Return URL handling | Widget embedded in hotel site | `returnUrl` param preserves back-navigation to hotel site after booking |

---

## 2. SUPPLIER — Dashboard & Operations

### P0 — Blocking

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 1 | Sign up / login | Auth page | Email + password, email verification, redirect to dashboard |
| 2 | Create organization | Onboarding flow | Select "Supplier", enter business name, create partner + org + user_partner records |
| 3 | Stripe Connect onboarding | Supplier needs payouts | Create connected Express account (Edge Function), hosted onboarding link, complete KYC, `account.updated` webhook sets `stripe_onboarding_complete` |
| 4 | Create experience | Experience Form / Dashboard | All tabs save: Basic (title, desc, images, duration, location, meeting point, max participants), Pricing (4 types), Availability (days, hours, seasons), Policies (cancellation, allows_requests) |
| 5 | Create sessions | Calendar -> Add session | Week/Day view click slot -> create session; recurring (daily/weekly) option |
| 6 | Accept request (email) | One-click Accept link | Token verified, private session created, status -> `approved`, Stripe payment link created, guest emailed |
| 7 | Decline request (email) | One-click Decline link | Token verified, status -> `declined`, optional message, guest emailed |
| 8 | Accept request (dashboard) | Booking Management -> Accept | JWT auth, same outcome as email accept |
| 9 | Decline request (dashboard) | Booking Management -> Decline | JWT auth, optional message, same outcome as email decline |
| 10 | Post-experience: confirm completion | Completion check email -> "Yes" | Token verified, booking `completed`, Stripe transfer (80%) to connected account, payout email to supplier |
| 11 | Post-experience: refund guest | Completion check email -> "No - Refund" | Token verified, full refund via Stripe, session -> `available`, no payout |
| 12 | Post-experience: no-show | Completion check email -> "No - No refund" | Token verified, booking `completed`, supplier paid (transfer), no refund |
| 13 | Block accept without Stripe | Accept flow | Error if `stripe_onboarding_complete` is false, prompt onboarding |

### P1 — Critical

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 14 | Propose new time | Dashboard -> Pending request | Supplier proposes 1-3 alternative times, status -> `proposed`, guest emailed with Select/Decline |
| 15 | View pending requests | Booking Management tab | Pending tab shows requests with details, urgency badge, accept/decline actions |
| 16 | View upcoming sessions | Booking Management tab | Grouped by date, expand for guest details |
| 17 | Session detail page | Session click-through | Pricing override, guest details, booking status, language preferences |
| 18 | Cancel session | Calendar / Session detail | Confirmation dialog; refunds if has paid booking; session -> `cancelled` |
| 19 | Edit session pricing | Session Detail -> Edit | Session-level price override; clear to use default |
| 20 | Drag session (reschedule) | Week/Day calendar view | Change time, auto-save, visual feedback |
| 21 | Delete session | Only if no reservations | Prevents delete with existing bookings/reservations (DB trigger or RLS) |
| 22 | Auto-complete (7 days) | Cron | `confirmed` 7+ days past experience -> complete, transfer, email |
| 23 | Experience activation toggle | Toggle active/draft | Active experiences visible in widget; draft hidden from distribution |
| 24 | Multi-org switching | Account dropdown | Switch between supplier organizations, correct data isolation per org |

### P2 — Important

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 25 | Home dashboard | `/supplier/dashboard` | Pending request count, upcoming sessions preview, Stripe onboarding prompt if incomplete |
| 26 | Experience list | Experiences page | Create, edit, status filter, grid view |
| 27 | Calendar navigation | Month / Week / Day views | Navigate between dates, sessions shown correctly, click to create |
| 28 | Past sessions | Booking Management | View completed/cancelled sessions, refund status per guest |
| 29 | Accept/decline idempotency | Double-click link | "Already accepted" / "Already approved" message, no duplicate operations |
| 30 | Image upload | Experience Form | Client-side compression (WebP), upload to Supabase Storage, cover + gallery images |

### P3 — Nice-to-have

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 31 | Performance metrics | Analytics page | Conversion rate, response rate, revenue stats |
| 32 | Language preferences per guest | Session detail | Flag + language name displayed per booking |

---

## 3. HOTEL — Distribution & Widget

### P0 — Blocking

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 1 | Sign up / login | Auth | Same as supplier (shared auth system) |
| 2 | Add business (single property) | Onboarding | Create org (hotel type), create hotel_config with unique slug |
| 3 | Select experiences | Experience Selection page | Browse available experiences, toggle on -> creates `distribution` (active), toggle off -> deactivates |
| 4 | Embed code | Embed Setup page | Copy script + HTML snippet, widget loads on external site via Shadow DOM |
| 5 | Widget serves correct data | `GET /api/embed/{slug}` | Returns only active, distributed experiences for that hotel + theme config |
| 6 | Commission recorded per booking | Payment webhook | `hotel_amount_cents` calculated from distribution rates, stored on booking |

### P1 — Critical

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 7 | Multi-property | hotel_configs | One org, multiple hotel configs; each has unique slug, own widget, own experience selection |
| 8 | Widget customization | Hotel settings | Theme (accent color, fonts, spacing, alignment) saved and applied to widget |
| 9 | Self-owned experiences | Hotel is also supplier | Commission fix: 92% supplier / 0% hotel / 8% platform when hotel = supplier |
| 10 | Multi-org switching | Account dropdown | Switch between hotel organizations |
| 11 | Distribution commission rates | Per distribution | Custom rates per experience/hotel override default 80/12/8 |

### P2 — Important

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 12 | Stay dashboard | Hotel Dashboard | Property list, click-through to property detail |
| 13 | Location settings | Hotel config | Lat/lng for location-based features (receptionist, radius filtering) |
| 14 | Hotel commission payout | Monthly batch | **GAP:** Currently only recorded in DB; batch payout mechanism to hotels needs implementation |
| 15 | Direct link to widget | Full-page URL | Hotel can share `book.traverum.com/{slug}` for QR codes, social media, etc. |

### P3 — Nice-to-have

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 16 | Commission earned notification | Email | Hotel notified when commission earned on a booking |
| 17 | Receptionist booking portal | `/receptionist/book` | **Planned:** Receptionist books for hotel guests, payment link emailed |

---

## 4. SYSTEM — Cron Jobs, Webhooks & Integrations

### P0 — Blocking

| # | Scenario | Schedule | What Must Work |
|---|----------|----------|----------------|
| 1 | Expire unpaid reservations | Every 15 min | `approved` + `payment_deadline` passed + no booking exists -> `expired`, session -> `available`, email guest + supplier |
| 2 | Expire pending/proposed | Every hour | `pending`/`proposed` + `response_deadline` passed -> `expired`, email guest |
| 3 | Completion check email | Daily 10:00 | Yesterday's `confirmed` bookings -> email supplier with Yes / No-Refund / No-NoRefund action links |
| 4 | Auto-complete bookings | Daily 02:00 | `confirmed` 7+ days past session -> `completed`, Stripe transfer, payout email |
| 5 | Stripe webhook: payment success | Real-time | `checkout.session.completed` / `payment_intent.succeeded` -> create booking, idempotent, emails sent |
| 6 | Stripe webhook: account updated | Real-time | `account.updated` -> update `stripe_onboarding_complete` on partner |
| 7 | Stripe webhook: payment failed | Real-time | `payment_intent.payment_failed` -> session -> `available`, email guest with retry link |
| 8 | Stripe webhook: charge refunded | Real-time | `charge.refunded` -> booking `cancelled`, session -> `available`, refund email to guest |

### P1 — Critical

| # | Scenario | What Must Work |
|---|----------|----------------|
| 9 | Cron authentication | `CRON_SECRET` Bearer token verified on every cron endpoint |
| 10 | Webhook signature verification | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| 11 | Webhook retries / idempotency | Stripe retries failed webhooks; handler checks for existing booking before creating |
| 12 | Email delivery | All templates; critical path emails (payment confirmation, payment link) must not fail silently |
| 13 | Token-based actions | Accept/decline/complete/cancel tokens: HMAC-SHA256, expiring, idempotent, one-click |
| 14 | Payment link creation | Stripe Payment Link with `reservationId` in metadata, correct amount, correct currency |
| 15 | Transfer with source_transaction | Charge ID retrieved from payment intent; required for test mode transfers |

### P2 — Important

| # | Scenario | What Must Work |
|---|----------|----------------|
| 16 | Embed API caching | `s-maxage=60, stale-while-revalidate=300` for performance |
| 17 | Embed CORS headers | `Access-Control-Allow-Origin: *` for cross-origin embedding |
| 18 | Manual booking recovery | `/api/bookings/manual-create` endpoint for recovering from missed webhooks |
| 19 | Stripe webhook: transfer created | `transfer.created` -> update booking with transfer ID |

---

## 5. EDGE CASES & ROBUSTNESS

### P0 — Must Handle

| Scenario | Expected Handling |
|----------|-------------------|
| Webhook arrives before redirect | Booking may already exist; idempotency check (`SELECT WHERE reservation_id`) prevents duplicate |
| Double Accept click (email link) | Token verified, "Already accepted/approved" message returned |
| Double Accept click (dashboard) | Status check: `if (reservation_status !== 'pending')` returns error |
| Pay link clicked after 24h expiry | Cron already expired reservation; Stripe link still works but webhook finds expired reservation — should handle gracefully |
| Session already booked at time of submit | Session status check: `session_status !== 'available'` returns 400, guest sees "Session no longer available" |
| No Stripe account on accept | `stripe_onboarding_complete` check blocks accept, returns error prompting onboarding |
| Distribution not found for booking | Webhook handler must find distribution for commission split; if missing, log error but still create booking |
| Transfer fails | Log error, booking still marked completed; manual retry possible |
| Price mismatch at submit | Server recalculates price, compares with submitted total, rejects if > 1 cent difference |
| Session status set to booked but reservation insert fails | Rollback: restore session to `available` |

### P1 — Should Handle

| Scenario | Expected Handling |
|----------|-------------------|
| Cancel link outside cancellation window | Show policy-appropriate message ("Non-refundable" or "Window closed") |
| Decline after Accept | Blocked: status check prevents double-processing |
| Propose for non-pending reservation | Dashboard UI blocks; API validates status |
| Guest manipulates slot parameter | Server validates proposed slot against `proposed_times` stored on reservation |
| Cron runs during active booking | All crons check for existing bookings before expiring (prevents expiring a reservation that was just paid) |
| Multiple cron jobs overlap | expire-reservations and expire-unpaid overlap in scope — should be consolidated or deduplicated |
| Email sending fails | Logged but doesn't block the core operation (booking creation, status update) |
| Supplier has no email | Skip supplier notification, log warning |
| Session deleted while guest is checking out | Reservation insert may succeed but session already deleted — session validation fails |

### P2 — Nice to Handle

| Scenario | Expected Handling |
|----------|-------------------|
| Rate limiting on public API | `/api/reservations` and `/api/embed/{slug}` should have rate limiting |
| XSS in guest name/email | Input sanitization before storing and rendering in emails |
| Very long experience titles | Truncation in email templates, widget cards |
| Timezone handling | Session dates stored as date strings (no timezone); times as `HH:MM:SS` — consistent for single-region (Finland) |

---

## 6. KNOWN GAPS & RISKS

| # | Gap | Risk | Recommendation |
|---|-----|------|----------------|
| 1 | **Hotel commission payout** | Hotels see recorded commission but no mechanism pays them | Implement monthly batch payout or Stripe Connect for hotels |
| 2 | **Cron job overlap** | `expire-reservations` and `expire-unpaid` have overlapping logic | Consolidate into a single cron or ensure idempotency across both |
| 3 | **No rate limiting** | Public endpoints (`/api/reservations`, `/api/embed/`) have no rate limiting | Add rate limiting middleware or Vercel Edge config |
| 4 | **Manual booking recovery** | `/api/bookings/manual-create` has no authentication | Add admin auth or restrict to internal use only |
| 5 | **Token expiry** | Accept/decline tokens have long expiry (14 days) but reservation deadline is 48h | Tokens should validate deadline in addition to expiry |
| 6 | **No webhook event logging** | Failed webhooks are logged to console only | Add persistent webhook event log table for debugging |
| 7 | **Self-owned experience commission** | Special 92/0/8 split when hotel = supplier documented but implementation may be incomplete | Verify with test: hotel selects own experience, guest books, check commission split |
| 8 | **Email template consistency** | Some emails use inline HTML strings (cron routes), others use template functions | Migrate all emails to use template functions from `templates.ts` |

---

## 7. SUMMARY BY PRIORITY

### Must work 100% (P0) — ~45 items

**Traveler:** Browse, detail, session booking (one group per session), Stripe payment, webhook -> booking, confirmation emails, commission split, request flow, pay-after-approval, cancellation within policy.

**Supplier:** Auth, org creation, Stripe Connect onboarding, create experience (all tabs), create sessions, accept/decline (email + dashboard), completion check (3 outcomes), Stripe transfer, block accept without Stripe.

**Hotel:** Auth, add business, select experiences, embed code, widget serves correct data, commission recorded.

**System:** 4 cron jobs (expire-unpaid, expire-pending, completion-check, auto-complete), 4 Stripe webhook events (payment success, payment failed, charge refunded, account updated).

### Critical (P1) — ~25 items

Pricing correctness, availability filtering, reservation status page, payment/request expiry, propose new time, booking management, session management, drag/reschedule, auto-complete, experience activation, multi-org, cron auth, webhook idempotency, email delivery, token security, payment link creation.

### Important (P2) — ~20 items

Embed/full-page modes, theming, cancellation policy display, demo mode, dashboard views, calendar navigation, image upload, hotel commission payout, location settings, API caching/CORS, manual recovery endpoint.

---

## 8. RECOMMENDED VERIFICATION ORDER

**Phase 1 — Core Money Flow (do first, blocks everything)**
1. Guest books session-based experience -> session claimed -> pays -> confirmation email received -> supplier notified
2. Supplier confirms completion -> transfer -> payout email
3. Guest cancels within window -> refund processed -> session released

**Phase 2 — Request Flow**
4. Guest requests custom time -> supplier accepts via email -> private session created -> guest pays -> booking confirmed
5. Guest requests -> supplier declines -> guest notified
6. Supplier proposes new time -> guest selects -> pays -> confirmed

**Phase 3 — Cron Jobs**
7. Trigger `expire-unpaid` manually -> approved reservations with passed deadline expire, sessions released
8. Trigger `expire-reservations` manually -> pending/proposed reservations expire
9. Trigger `completion-check` manually -> supplier gets email with action buttons
10. Trigger `auto-complete` manually -> old confirmed bookings complete + transfer

**Phase 4 — Stripe Webhooks**
11. Use Stripe CLI to trigger `checkout.session.completed` -> booking created
12. Trigger `payment_intent.payment_failed` -> session released, guest emailed
13. Trigger `charge.refunded` -> booking cancelled
14. Trigger `account.updated` -> partner onboarding status updated

**Phase 5 — Hotel & Distribution**
15. Hotel adds business -> selects experiences -> embed code works -> widget loads
16. Widget shows only distributed, active experiences with correct theme
17. Commission split stored correctly on booking

**Phase 6 — Multi-Org & Edge Cases**
18. Create 2 supplier orgs, switch between them, verify data isolation
19. Create multi-property hotel, verify per-property widget/embed
20. Double-click accept link -> "Already accepted" message
21. Pay link after expiry -> graceful handling
22. Session already booked at checkout -> "Session no longer available" error

---

*Last updated: February 2026*
