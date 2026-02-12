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
| 3 | Session-based booking (instant) | Detail -> Pick session -> Checkout -> Stripe | Select date/time with available spots, enter name/email/phone, participant selector starts at 1, redirect to Stripe Payment Link, pay |
| 4 | Stripe payment success | Stripe Checkout -> Webhook | `checkout.session.completed` or `payment_intent.succeeded` creates booking, idempotent (no duplicate bookings), reservation marked `approved`, booking `confirmed` |
| 5 | Payment confirmation emails | Post-payment | Guest receives confirmation with booking ref, details, cancel link, cancellation policy. Supplier receives guest details notification. |
| 6 | Request-based booking | Detail -> Custom date/time -> Submit | Creates `pending` reservation (48h deadline), supplier receives email with Accept/Decline buttons, guest redirected to reservation status page |
| 7 | Pay after approval | Supplier accepts -> Guest gets Pay Now email -> Stripe | Payment link works (24h deadline), same webhook flow as session-based, booking confirmed |
| 8 | Guest cancellation (within policy window) | Cancel link in confirmation email | Full refund via Stripe, spots released, both parties emailed, booking `cancelled` |
| 9 | Commission split on payment | Webhook creates booking | `supplier_amount_cents`, `hotel_amount_cents`, `platform_amount_cents` stored correctly per distribution rates (default 80/12/8) |

### P1 — Critical

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 10 | Minimum-to-run booking | Session with `min_participants > 1`, below threshold | Guest sees "X/Y min. booked", CTA says "Reserve Spot", reservation created as `pending_minimum` (no payment), guest + supplier emailed |
| 11 | Min-to-run threshold met | New booking tips total >= min_participants | Current guest pays normally, all existing `pending_minimum` reservations auto-approved with 24h payment links |
| 12 | Supplier confirms session early | Dashboard -> "Confirm Session Early" | All `pending_minimum` reservations get payment links, status -> `approved`, guests emailed |
| 13 | Min-to-run cancellation (48h cutoff) | Cron: session < 48h away, min not met | All `pending_minimum` reservations -> `cancelled_minimum`, spots released, guests + supplier emailed, no payment taken |
| 14 | Price calculation correctness | All pricing types | Per-person, flat-rate, base+extra, per-day; min_participants is NOT a price floor; each guest pays for exact participants brought; session override takes precedence |
| 15 | Availability filtering | Calendar in widget | Unavailable days disabled; operating hours shown; seasonal rules applied; past dates disabled |
| 16 | Reservation status page | `/reservation/{id}` | Guest sees pending / pending_minimum / approved / declined / expired / cancelled_minimum status with correct message and action |
| 17 | Payment expired (24h) | Cron: expire-unpaid | `approved` + `payment_deadline` passed + no booking -> `expired`, spots released, guest + supplier emailed |
| 18 | Request expired (48h) | Cron: expire-reservations | `pending`/`proposed` + `response_deadline` passed -> `expired`, guest emailed |
| 19 | Propose new time - guest selects | Supplier proposes -> Email with slots | One-click Select creates session, approves, sends Pay Now link |
| 20 | Propose new time - guest declines | Email "None work" button | Reservation -> `declined`, supplier notified |

### P2 — Important

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 21 | Embed mode (Shadow DOM) | `<traverum-widget hotel="slug">` | Widget loads inside Shadow DOM, CSS isolation from host page, theme applied, responsive |
| 22 | Full-page mode | `book.traverum.com/{slug}` | Same experience, standalone page, works for QR codes / email links |
| 23 | Theming | Hotel config | Accent color, fonts, spacing, alignment applied correctly per hotel property |
| 24 | Cancel outside policy window | Cancel link | Shows "Non-refundable" or "Window closed" message gracefully, doesn't allow refund |
| 25 | Demo mode | `hotel-traverum` | Checkout simulates success without real Stripe call |
| 26 | Cancellation policy display | Experience detail + confirmation email | Policy text from database shown (flexible/moderate/strict/non_refundable), cancel button conditional |

### P3 — Nice-to-have

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 27 | Stripe receipt | Automatic | Stripe sends receipt (enabled in Stripe Dashboard settings) |
| 28 | Responsive / mobile UX | Bottom sheet, sticky bar, participant selector | Full mobile booking flow works end-to-end |
| 29 | Image gallery | Detail page | Gallery opens, swipe/navigate, close; no hydration errors (inline SVGs, no lucide-react) |
| 30 | Return URL handling | Widget embedded in hotel site | `returnUrl` param preserves back-navigation to hotel site after booking |

---

## 2. SUPPLIER — Dashboard & Operations

### P0 — Blocking

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 1 | Sign up / login | Auth page | Email + password, email verification, redirect to dashboard |
| 2 | Create organization | Onboarding flow | Select "Supplier", enter business name, create partner + org + user_partner records |
| 3 | Stripe Connect onboarding | Supplier needs payouts | Create connected Express account (Edge Function), hosted onboarding link, complete KYC, `account.updated` webhook sets `stripe_onboarding_complete` |
| 4 | Create experience | Experience Form / Dashboard | All tabs save: Basic (title, desc, images, duration, location, meeting point, min/max participants), Pricing (4 types), Availability (days, hours, seasons), Policies (cancellation, allows_requests) |
| 5 | Create sessions | Calendar -> Add session | Week/Day view click slot -> create session with capacity; recurring (daily/weekly) option |
| 6 | Accept request (email) | One-click Accept link | Token verified, session created/reused, status -> `approved`, Stripe payment link created, guest emailed |
| 7 | Decline request (email) | One-click Decline link | Token verified, status -> `declined`, optional message, guest emailed |
| 8 | Accept request (dashboard) | Booking Management -> Accept | JWT auth, same outcome as email accept |
| 9 | Decline request (dashboard) | Booking Management -> Decline | JWT auth, optional message, same outcome as email decline |
| 10 | Post-experience: confirm completion | Completion check email -> "Yes" | Token verified, booking `completed`, Stripe transfer (80%) to connected account, payout email to supplier |
| 11 | Post-experience: refund guest | Completion check email -> "No - Refund" | Token verified, full refund via Stripe, spots released, no payout |
| 12 | Post-experience: no-show | Completion check email -> "No - No refund" | Token verified, booking `completed`, supplier paid (transfer), no refund |
| 13 | Block accept without Stripe | Accept flow | Error if `stripe_onboarding_complete` is false, prompt onboarding |

### P1 — Critical

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 14 | Propose new time | Dashboard -> Pending request | Supplier proposes 1-3 alternative times, status -> `proposed`, guest emailed with Select/Decline |
| 15 | View pending requests | Booking Management tab | Pending tab shows requests with details, urgency badge, accept/decline actions |
| 16 | View upcoming sessions | Booking Management tab | Grouped by date, expand for guest list, copy emails (paid guests only) |
| 17 | Session detail page | Session click-through | Capacity editing, pricing override, guest list with statuses, language preferences |
| 18 | Min-to-run progress on session | Session Detail | Shows "X/Y minimum participants" progress bar, "Confirm Session Early" button, pending_minimum guest badge |
| 19 | Cancel session | Calendar / Session detail | Confirmation dialog; refunds if has paid bookings; cancels pending_minimum reservations |
| 20 | Edit session capacity | Session Detail -> Edit | Change spots_total/spots_available; warn about existing bookings |
| 21 | Edit session pricing | Session Detail -> Edit | Session-level price override; clear to use default |
| 22 | Drag session (reschedule) | Week/Day calendar view | Change time, auto-save, visual feedback |
| 23 | Delete session | Only if no reservations | Prevents delete with existing bookings/reservations (DB trigger or RLS) |
| 24 | Auto-complete (7 days) | Cron | `confirmed` 7+ days past experience -> complete, transfer, email |
| 25 | Experience activation toggle | Toggle active/draft | Active experiences visible in widget; draft hidden from distribution |
| 26 | Multi-org switching | Account dropdown | Switch between supplier organizations, correct data isolation per org |
| 27 | Booking management badges | Upcoming sessions tab | Amber "X/Y min" badge for sessions below minimum; "Waiting for min." guest status |

### P2 — Important

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 28 | Home dashboard | `/supplier/dashboard` | Pending request count, upcoming sessions preview, Stripe onboarding prompt if incomplete |
| 29 | Experience list | Experiences page | Create, edit, status filter, grid view |
| 30 | Calendar navigation | Month / Week / Day views | Navigate between dates, sessions shown correctly, click to create |
| 31 | Past sessions | Booking Management | View completed/cancelled sessions, refund status per guest |
| 32 | Accept/decline idempotency | Double-click link | "Already accepted" / "Already approved" message, no duplicate operations |
| 33 | Image upload | Experience Form | Client-side compression (WebP), upload to Supabase Storage, cover + gallery images |

### P3 — Nice-to-have

| # | Scenario | Flow | What Must Work |
|---|----------|------|----------------|
| 34 | Performance metrics | Analytics page | Conversion rate, response rate, revenue stats |
| 35 | Language preferences per guest | Session detail | Flag + language name displayed per booking |

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
| 1 | Expire unpaid reservations | Every 15 min | `approved` + `payment_deadline` passed + no booking exists -> `expired`, release spots, email guest + supplier |
| 2 | Expire pending/proposed | Every hour | `pending`/`proposed` + `response_deadline` passed -> `expired`, email guest |
| 3 | Cancel pending_minimum (48h cutoff) | Every hour | `pending_minimum` + session < 48h away + min not met -> `cancelled_minimum`, release spots, email guest + supplier |
| 4 | Completion check email | Daily 10:00 | Yesterday's `confirmed` bookings -> email supplier with Yes / No-Refund / No-NoRefund action links |
| 5 | Auto-complete bookings | Daily 02:00 | `confirmed` 7+ days past session -> `completed`, Stripe transfer, payout email |
| 6 | Stripe webhook: payment success | Real-time | `checkout.session.completed` / `payment_intent.succeeded` -> create booking, idempotent, emails sent |
| 7 | Stripe webhook: account updated | Real-time | `account.updated` -> update `stripe_onboarding_complete` on partner |
| 8 | Stripe webhook: payment failed | Real-time | `payment_intent.payment_failed` -> release spots, email guest with retry link |
| 9 | Stripe webhook: charge refunded | Real-time | `charge.refunded` -> booking `cancelled`, spots released, refund email to guest |

### P1 — Critical

| # | Scenario | What Must Work |
|---|----------|----------------|
| 10 | Cron authentication | `CRON_SECRET` Bearer token verified on every cron endpoint |
| 11 | Webhook signature verification | `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET` |
| 12 | Webhook retries / idempotency | Stripe retries failed webhooks; handler checks for existing booking before creating |
| 13 | Email delivery | Resend sends all 15+ templates; critical path emails (payment confirmation, payment link) must not fail silently |
| 14 | Token-based actions | Accept/decline/complete/cancel tokens: HMAC-SHA256, expiring, idempotent, one-click |
| 15 | Payment link creation | Stripe Payment Link with `reservationId` in metadata, correct amount, correct currency |
| 16 | Transfer with source_transaction | Charge ID retrieved from payment intent; required for test mode transfers |

### P2 — Important

| # | Scenario | What Must Work |
|---|----------|----------------|
| 17 | Embed API caching | `s-maxage=60, stale-while-revalidate=300` for performance |
| 18 | Embed CORS headers | `Access-Control-Allow-Origin: *` for cross-origin embedding |
| 19 | Manual booking recovery | `/api/bookings/manual-create` endpoint for recovering from missed webhooks |
| 20 | Stripe webhook: transfer created | `transfer.created` -> update booking with transfer ID |

---

## 5. EDGE CASES & ROBUSTNESS

### P0 — Must Handle

| Scenario | Expected Handling |
|----------|-------------------|
| Webhook arrives before redirect | Booking may already exist; idempotency check (`SELECT WHERE reservation_id`) prevents duplicate |
| Double Accept click (email link) | Token verified, "Already accepted/approved" message returned |
| Double Accept click (dashboard) | Status check: `if (reservation_status !== 'pending')` returns error |
| Pay link clicked after 24h expiry | Cron already expired reservation; Stripe link still works but webhook finds expired reservation — should handle gracefully |
| Session full at time of submit | `spots_available < participants` check returns 400, guest sees "Not enough spots" |
| No Stripe account on accept | `stripe_onboarding_complete` check blocks accept, returns error prompting onboarding |
| Distribution not found for booking | Webhook handler must find distribution for commission split; if missing, log error but still create booking |
| Transfer fails | Log error, booking still marked completed; manual retry possible |
| Price mismatch at submit | Server recalculates price, compares with submitted total, rejects if > 1 cent difference |
| Spots deducted but reservation insert fails | Rollback: restore original spots_available and session_status |
| Pending_minimum reservation + guest tries to pay | No payment link exists; guest sees "Spot Reserved" page, no payment action |

### P1 — Should Handle

| Scenario | Expected Handling |
|----------|-------------------|
| Cancel link outside cancellation window | Show policy-appropriate message ("Non-refundable" or "Window closed") |
| Decline after Accept | Blocked: status check prevents double-processing |
| Propose for non-pending reservation | Dashboard UI blocks; API validates status |
| Guest manipulates slot parameter | Server validates proposed slot against `proposed_times` stored on reservation |
| Cron runs during active booking | All crons check for existing bookings before expiring (prevents expiring a reservation that was just paid) |
| Multiple cron jobs overlap | expire-reservations, expire-unpaid, and expire-pending overlap in scope — should be consolidated or deduplicated |
| Email sending fails | Logged but doesn't block the core operation (booking creation, status update) |
| Supplier has no email | Skip supplier notification, log warning |
| Session deleted while guest is checking out | Reservation insert may succeed but session already deleted — spots validation fails |

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
| 2 | **Cron job overlap** | `expire-reservations` and `expire-unpaid` / `expire-pending` have overlapping logic | Consolidate into a single cron or ensure idempotency across all three |
| 3 | **No rate limiting** | Public endpoints (`/api/reservations`, `/api/embed/`) have no rate limiting | Add rate limiting middleware or Vercel Edge config |
| 4 | **Manual booking recovery** | `/api/bookings/manual-create` has no authentication | Add admin auth or restrict to internal use only |
| 5 | **Token expiry** | Accept/decline tokens have long expiry (14 days) but reservation deadline is 48h | Tokens should validate deadline in addition to expiry |
| 6 | **No webhook event logging** | Failed webhooks are logged to console only | Add persistent webhook event log table for debugging |
| 7 | **Self-owned experience commission** | Special 92/0/8 split when hotel = supplier documented but implementation may be incomplete | Verify with test: hotel selects own experience, guest books, check commission split |
| 8 | **Pending_minimum + request-based** | Min-to-run only applies to session-based bookings; request-based bookings bypass minimum | Documented behavior, but could confuse suppliers who set min > 1 |
| 9 | **Spots_available correctness** | Spots deducted on reservation creation, released on expiry/cancellation — race conditions possible under high concurrency | Consider database-level locking or atomic decrement |
| 10 | **Email template consistency** | Some emails use inline HTML strings (cron routes), others use template functions | Migrate all emails to use template functions from `templates.ts` |

---

## 7. SUMMARY BY PRIORITY

### Must work 100% (P0) — ~50 items

**Traveler:** Browse, detail, session booking, Stripe payment, webhook -> booking, confirmation emails, commission split, request flow, pay-after-approval, cancellation within policy.

**Supplier:** Auth, org creation, Stripe Connect onboarding, create experience (all tabs), create sessions, accept/decline (email + dashboard), completion check (3 outcomes), Stripe transfer, block accept without Stripe.

**Hotel:** Auth, add business, select experiences, embed code, widget serves correct data, commission recorded.

**System:** 5 cron jobs (expire-unpaid, expire-pending, cancel-pending-minimum, completion-check, auto-complete), 4 Stripe webhook events (payment success, payment failed, charge refunded, account updated).

### Critical (P1) — ~30 items

Min-to-run full lifecycle, pricing correctness, availability filtering, reservation status page, payment/request expiry, propose new time, booking management, session management, drag/reschedule, auto-complete, experience activation, multi-org, min progress indicators, cron auth, webhook idempotency, email delivery, token security, payment link creation.

### Important (P2) — ~20 items

Embed/full-page modes, theming, cancellation policy display, demo mode, dashboard views, calendar navigation, image upload, hotel commission payout, location settings, API caching/CORS, manual recovery endpoint.

---

## 8. RECOMMENDED VERIFICATION ORDER

**Phase 1 — Core Money Flow (do first, blocks everything)**
1. Guest books session-based experience -> pays -> confirmation email received -> supplier notified
2. Supplier confirms completion -> transfer -> payout email
3. Guest cancels within window -> refund processed -> spots released

**Phase 2 — Request Flow**
4. Guest requests custom time -> supplier accepts via email -> guest pays -> booking confirmed
5. Guest requests -> supplier declines -> guest notified
6. Supplier proposes new time -> guest selects -> pays -> confirmed

**Phase 3 — Min-to-Run Flow**
7. Guest books session below minimum -> `pending_minimum` created -> reservation page shows "Spot Reserved"
8. Another guest books, tipping past minimum -> all `pending_minimum` auto-approved -> payment links sent
9. Supplier confirms session early from dashboard -> payment links sent
10. Cron cancels `pending_minimum` when session < 48h and min not met -> guests + supplier emailed

**Phase 4 — Cron Jobs**
11. Trigger `expire-unpaid` manually -> approved reservations with passed deadline expire
12. Trigger `expire-reservations` manually -> pending/proposed reservations expire
13. Trigger `completion-check` manually -> supplier gets email with action buttons
14. Trigger `auto-complete` manually -> old confirmed bookings complete + transfer

**Phase 5 — Stripe Webhooks**
15. Use Stripe CLI to trigger `checkout.session.completed` -> booking created
16. Trigger `payment_intent.payment_failed` -> spots released, guest emailed
17. Trigger `charge.refunded` -> booking cancelled
18. Trigger `account.updated` -> partner onboarding status updated

**Phase 6 — Hotel & Distribution**
19. Hotel adds business -> selects experiences -> embed code works -> widget loads
20. Widget shows only distributed, active experiences with correct theme
21. Commission split stored correctly on booking

**Phase 7 — Multi-Org & Edge Cases**
22. Create 2 supplier orgs, switch between them, verify data isolation
23. Create multi-property hotel, verify per-property widget/embed
24. Double-click accept link -> "Already accepted" message
25. Pay link after expiry -> graceful handling
26. Session full at checkout -> "Not enough spots" error

---

*Last updated: February 2026*
