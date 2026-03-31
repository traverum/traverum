# 2026-03-26_pay-on-site-phase4

## Goal
Implement Reserve & Pay on Site **Phase 4** — guest checkout UI: Stripe Setup Intent + Payment Element (deferred pattern), guarantee pages for request-based flow, reservation status messaging for confirmed pay_on_site bookings.

## Blast Radius
Medium by design, mitigated: Elements provider only when `payment_mode === pay_on_site` and session-based checkout; default `stripe` path unchanged.

## Done
- Installed `@stripe/stripe-js` and `@stripe/react-stripe-js` in `apps/widget`
- `apps/widget/src/lib/stripe-client.ts` — `loadStripe` singleton + Appearance API (static hex; matches warm widget palette)
- `StripeSetupProvider` — `Elements` with `mode: 'setup'`, `currency: 'eur'`
- `CardGuaranteeSection` — PaymentElement + mandate checkbox; exposes stripe/elements via ref for `CheckoutForm`
- `CheckoutForm` — `paymentMode` + `cancellationPolicyText`; session pay_on_site: `elements.submit` → POST reservations → `confirmSetup` → POST confirm-guarantee → reservation page
- Hotel + Veyond checkout pages: join supplier `payment_mode`, conditional `StripeSetupProvider` wrap
- `GuaranteeForm` + guarantee routes: `[hotelSlug]/reservation/[id]/guarantee`, `experiences/reservation/[id]/guarantee` (approved, pay_on_site, no booking yet)
- `SetupIntentConfirmer` + Suspense on reservation status pages — handles rare Stripe redirect (`setup_intent` query); calls confirm-guarantee then strips params
- Reservation pages: when booking exists with `payment_mode pay_on_site` + confirmed, show “Reservation confirmed / pay on site” and hide payment link CTA
- Plan todo `phase-4-checkout-ui` marked completed in `.cursor/plans/reserve_and_pay_on_site_89cde0e1.plan.md`

## Decisions
- Request-based pay_on_site: no card on main checkout; card only on guarantee page (matches Phase 2 email URLs)
- Appearance API: no `var()` in color variables (Stripe limitation); use resolved hex

## Open Items
- [ ] Set **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** on Vercel widget (staging + production) before relying on Phase 4 in deployed envs
- [ ] Reserve & Pay on Site **Phases 5–7** (attendance → cancellation charge → invoicing) per plan file
- [ ] Widget `pnpm typecheck` still fails on **pre-existing** errors (`sync-divinea` route, `hotels.ts`, `commission.test.ts`, `sessions.test.ts`) — none introduced by Phase 4

## Notes
- Backend Phase 2 routes unchanged in this session (`confirm-guarantee`, `setup-intent`, reservations POST branching)
