# Active State

Last updated: 2026-03-31

## Recently Done

- [x] **Production migration Phase 1 (merge to main):** PR #1 created and pushed. 311 files committed. All 337 unit tests pass. Widget typecheck fixed (restored convenience type aliases, ExperienceWithMedia intersection type, Supabase query type assertions). Dashboard and Admin Vercel preview builds pass. See [2026-03-31_production-migration-phase1](sessions/2026-03-31_production-migration-phase1.md).
- [x] **Experience search & filters:** Search bar (text + tag matching), date/time-of-day/people filters on full listing pages (hotel widget + Veyond direct). Netflix carousels switch to filtered grid when any filter is active. Session-based experiences filtered by actual session availability; request-based always shown with "On Request" badge. `CategoryAnchorSection` temporarily removed (redundant with tag pills). See [2026-03-28_experience-search-filters](sessions/2026-03-28_experience-search-filters.md).
- [x] **Hosts section (guest-facing supplier profiles):** New "Hosts" section on Veyond direct (`/experiences`) and hotel widget full pages showing supplier profiles with avatar, name, city, and link to host detail page. Five new columns on `partners` (`display_name`, `bio`, `avatar_url`, `profile_visible`, `partner_slug`). Migration `20260328120000_add_partner_profiles.sql` applied to staging. Dashboard Settings has new "Host profile" card with avatar upload, bio, slug, visibility toggle. `ScrollRow` extracted from `NetflixLayout` for reuse. Host detail pages at `/experiences/hosts/[hostSlug]` and `/[hotelSlug]/hosts/[hostSlug]`. Section renders at bottom of listing pages; renders nothing when no hosts have opted in. See [2026-03-28_hosts-section](sessions/2026-03-28_hosts-section.md).
- [x] **Experience tags + Veyond browse (Netflix rows):** Replaced single-category model with eight multi-select tags (`EXPERIENCE_TAGS` in `@traverum/shared`). Stored in existing `experiences.tags` (`text[]`). Data migration `20260327120000_replace_categories_with_tags.sql` remaps old slugs. Dashboard: `TagSelector`, form + dashboard + hotel selection updated. Widget: `/experiences` uses `NetflixLayout` (horizontal scroll per tag row); hotel widget `ExperienceListClient` filters by any tag. See [2026-03-27_experience-tags](sessions/2026-03-27_experience-tags.md) and `docs/deployment/DEPLOYMENT.md` (Experience tags subsection).
- [x] **Hydration error fix (lucide-react version mismatch):** Two versions of `lucide-react` (v0.462.0 at root, v0.562.0 in widget) caused SVG hydration mismatches on every page with Lucide icons. Fixed with webpack `resolve.alias` in `next.config.js`, version alignment across all apps to `^0.562.0`, and `pnpm.overrides` in root `package.json`.
- [x] **Checkout page redesign:** Structured cancellation terms, mobile-first summary ordering, flow-aware titles ("Reserve Your Spot"), pay-on-site info moved to price sidebar, duplicate back buttons removed, date format changed to globally unambiguous `27 Mar`, time displayed as range `15:00–17:00`, em dashes removed, country-specific placeholders removed, Stripe colorDanger matched to warm palette.
- [x] **Reserve & Pay on Site Phase 7 (monthly commission invoicing) — FINAL PHASE:** Cron `generate-invoices` (1st of month, 06:00 UTC) sums completed pay_on_site bookings' commission, subtracts cancellation credits, creates `commission_invoices` record, emails partner. Admin API routes for listing/marking paid. Supplier dashboard `/supplier/invoices` page with summary + table. Admin dashboard `/invoices` page with search/filter, mark paid, revert. All 7 phases of Reserve & Pay on Site are now code-complete.
- [x] **Reserve & Pay on Site Phase 6 (cancellation enforcement):** Shared helper `cancellation-charges.ts` (retrieve PaymentMethod → `chargeOffSession` → write `cancellation_charges` record). Guest cancel route refactored into `handlePayOnSiteCancellation` / `handleStripeCancellation` — within policy = free, outside policy = charge saved card. Attendance respond and cron routes charge for no-shows. 4 new email templates (charged, no-show charged, charge failed, free cancel). All gated on `payment_mode === 'pay_on_site'`.
- [x] **Reserve & Pay on Site Phase 5 (attendance verification):** Both no-experience routes (token + dashboard) now create `attendance_verifications` instead of cancelling pay_on_site bookings. Guest verification page (`GET /api/attendance/[token]`), respond endpoint (`POST /api/attendance/[token]/respond`), daily cron (`/api/cron/attendance-reminder` at 10:00 UTC — reminder on day 2, auto-resolve on day 3). Two new email templates (`guestAttendanceVerification`, `guestAttendanceReminder`). Verification tokens are DB-stored UUIDs.
- [x] **Reserve & Pay on Site Phase 4 (guest checkout UI):** `@stripe/stripe-js` + `@stripe/react-stripe-js`. Deferred Setup Intent pattern on session checkout (`StripeSetupProvider`, `CardGuaranteeSection`, `CheckoutForm` branching). Guarantee pages for request-based flow (`GuaranteeForm`, hotel + `/experiences` routes). `SetupIntentConfirmer` on reservation status pages for Stripe redirect return. Reservation pages show pay_on_site confirmed messaging; hide payment link when appropriate. Plan Phase 4 todo completed.
- [x] **Reserve & Pay on Site Phase 3 (dashboard support):** `payment_mode` branching in all complete/no-experience/cancel API routes (dashboard + public token-based) — pay_on_site skips `createTransfer` and `createRefund`. Auto-complete cron skips transfers for pay_on_site. Dashboard UI: "Pay on site" badge on booking cards, conditional dialog text (no refund/payout language), conditional toast messages, conditional button labels ("Cancel Booking" vs "Cancel & Refund"). `BookingItem` type extended with `paymentMode`. All emails branch: pay_on_site gets "commission on monthly invoice" messaging instead of Stripe transfer messaging.
- [x] **Reserve & Pay on Site Phase 2 (backend foundations):** Stripe helpers (`createStripeCustomer`, `createSetupIntent`, `chargeOffSession`, `getPaymentMethodFromSetupIntent`) with idempotency keys. Reservation API branches for pay_on_site (session-based returns `setupIntentClientSecret`). Both accept routes branch: pay_on_site skips Payment Link, sends "provide card guarantee" email. New endpoints: `POST /api/reservations/[id]/confirm-guarantee` (creates booking after Setup Intent succeeds), `POST /api/reservations/[id]/setup-intent` (request-based flow). 3 new email templates: `guestReservationConfirmedPayOnSite`, `supplierNewBookingPayOnSite`, `guestProvideGuarantee`. Stripe onboarding check skipped for pay_on_site suppliers.
- [x] **Reserve & Pay on Site Phase 1 (staging):** Migration applied — `payment_mode` on partners + bookings, `stripe_setup_intent_id` + `stripe_customer_id` on reservations, 3 new tables (`commission_invoices`, `attendance_verifications`, `cancellation_charges`) with RLS. Types regenerated from staging DB. Shared constants added (`PAYMENT_MODES`, `ATTENDANCE_VERIFICATION_DAYS`, `INVOICE_STATUSES`).
- [x] **Reserve & Pay on Site — full implementation plan:** 7-phase plan created, Stripe Setup Intent + Payment Element (deferred pattern) decided, plan at `.cursor/plans/reserve_and_pay_on_site_89cde0e1.plan.md`
- [x] **DiVinea Phase 1 implemented (staging):** migration, API client, test route, sync cron (30 min), dashboard read-only UX, integration doc revised
- [x] Staging only: deployed Supabase Edge Functions **`create-connect-account`** and **`stripe-webhooks`** via MCP `user-supabase-staging`; production untouched
- [x] DiVinea integration planning: API spec analysis, revised plan, full API docs
- [x] Receptionist `BookingPanel` UI pass: guest preview → Veyond direct URL, location/contact/details/booking hierarchy
- [x] Receptionist login: deterministic `user_partners` resolution
- [x] Phase 2 Tier 1: reservation-rules, booking-rules, cron-rules — 262 unit tests
- [x] Phase 3: Playwright E2E setup — 4 tests
- [x] Experience detail page UI restructure (hybrid layout, tabs, booking section)
- [x] GitHub Actions E2E workflow

## Known Issues

- Staging DB may drift from production schema (`sort_order` fallback in `hotels.ts`)
- Placeholder highlights/included/not-included shown for all experiences (no DB columns yet)
- Root `node_modules/lucide-react` still resolves to v0.462.0 despite pnpm overrides — mitigated by webpack alias in widget's `next.config.js`
- **CRITICAL before production deploy:** `partners.payment_mode` defaults to `'pay_on_site'`. Existing Stripe-active partners may need a data migration setting `payment_mode = 'stripe'` where `stripe_onboarding_complete = true`.

## Open Items

- [ ] **Production migration Phase 2–5:** Merge PR #1 → apply 8 migrations to production → regenerate types → deploy Dashboard → Widget → Admin → verify. Full checklist in [2026-03-31_production-migration-phase1](sessions/2026-03-31_production-migration-phase1.md).
- [ ] **CRITICAL: Check `payment_mode` default for existing partners** before applying `20260326120000_pay_on_site_schema.sql` to production. Existing Stripe partners will get `payment_mode = 'pay_on_site'` default. Likely need a follow-up migration: `UPDATE partners SET payment_mode = 'stripe' WHERE stripe_onboarding_complete = true`.
- [ ] **Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** is set on production Vercel (widget project) — required for pay-on-site card guarantee UI.
- [ ] **DiVinea `sync-divinea` cron** — verify it exits gracefully when env vars are not set on production (runs every 30 min).
- [x] **Checkout date format blast radius check:** `formatDate` changed from `27.03` to `27 Mar` globally — verified. 36 unit tests pass.
- [ ] **Invoice cron test:** Trigger `/api/cron/generate-invoices` manually on staging with a test partner that has completed pay_on_site bookings
- [ ] **PDF invoices (optional):** `commission_invoices.pdf_url` column exists but is unused — consider PDF generation later
- [ ] **DiVinea go-live:** Apply migration to production → set Vercel env vars → link one experience with `productId` → run first sync → verify widget
- [ ] Staging Stripe Connect: set **`STRIPE_SECRET_KEY`** (test) on staging Edge Function secrets; confirm dashboard **`VITE_SUPABASE_URL`** targets staging; retest supplier Connect flow
- [ ] Optional staging: **`STRIPE_WEBHOOK_SECRET`** + Stripe webhook URL for `stripe-webhooks`

## Latest Session

[2026-03-31_production-migration-phase1](sessions/2026-03-31_production-migration-phase1.md)
