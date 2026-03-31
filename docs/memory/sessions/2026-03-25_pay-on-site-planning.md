# 2026-03-25_pay-on-site-planning

## Goal
Plan the full implementation of "Reserve & Pay on Site" — a new payment mode where guests provide a card guarantee (Stripe Setup Intent) instead of paying upfront. Suppliers collect payment directly on site. Commission invoiced monthly.

## Blast Radius
Zero for Phases 1-3 (additive schema, new code paths gated on `payment_mode`). Medium for Phase 4 (checkout form changes, branched by prop). Zero for Phases 5-7 (new routes/crons, only activate for pay_on_site bookings).

## Done
- Full codebase exploration: database schema, API routes, checkout UI, email system, cron jobs, Stripe integration
- Created 7-phase implementation plan at `.cursor/plans/reserve_and_pay_on_site_89cde0e1.plan.md`
- Researched Stripe docs: Setup Intents API, Payment Element, deferred intent pattern, Checkout Session mode:setup
- Decided on Stripe Setup Intents + Payment Element (deferred pattern) for Phase 4
- Updated product doc `docs/product/system/booking-flow.md` already contains the full Reserve & Pay on Site specification

## Decisions
- **Card guarantee method:** Stripe Setup Intent (not card hold/manual capture — holds expire in 5-7 days, bookings are weeks out)
- **Client-side integration:** Payment Element with deferred intent pattern (not Checkout Session redirect). Reasons: UX control for "no charge" messaging, cancellation policy checkbox as Stripe mandate, no redirect for cards, Appearance API for styling
- **payment_mode on partners table:** Per-supplier setting, `'stripe'` (default) or `'pay_on_site'`
- **payment_mode denormalized on bookings:** For efficient cron/invoice queries without joining partners
- **Three new tables:** `commission_invoices`, `attendance_verifications`, `cancellation_charges`
- **Dependencies:** `@stripe/stripe-js` + `@stripe/react-stripe-js` in widget only
- **New env var:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Open Items
- [ ] **Phase 1:** Database migration + type regeneration + shared constants
- [ ] **Phase 2:** Backend foundations (Stripe functions, API branching, confirm-guarantee endpoint, email templates)
- [ ] **Phase 3:** Dashboard support (pay_on_site indicators, complete/no-experience branching, cron branching)
- [ ] **Phase 4:** Guest checkout UI (Payment Element, guarantee page, confirmation page)
- [ ] **Phase 5:** Attendance verification flow
- [ ] **Phase 6:** Cancellation enforcement (off-session charges)
- [ ] **Phase 7:** Monthly commission invoicing

## Notes
- Entity is `partners` not `suppliers` in the DB — `partner_type` distinguishes them
- No Stripe.js on the client today — all payment via Stripe Payment Links (redirect). Phase 4 introduces first client-side Stripe integration
- The deferred intent pattern avoids needing a SetupIntent before rendering the card form — renders with `mode: 'setup'` and `currency: 'eur'` immediately
- Booking flow product doc already updated with full pay_on_site spec before this session
