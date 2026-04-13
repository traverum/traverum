---
last_updated: 2026-04-13
compiled_from: edge functions, webhook handler, API routes, traverum-stripe skill
---

# Stripe Setup

## Account Structure

- **Platform account:** Traverum's main Stripe account
- **Connected accounts:** One per supplier, created via Stripe Connect Express
- **Connect flow:** Supplier clicks "Connect Stripe" in dashboard → Edge Function creates Express account → onboarding link → Stripe webhook updates `partners.stripe_onboarding_complete`

## Two Payment Modes

### Stripe (upfront payment)

1. Guest checks out → reservation created
2. Supplier accepts → Stripe Payment Link generated, guest emails with link
3. Guest pays → `payment_intent.succeeded` webhook → booking created
4. After experience → supplier marks complete → `stripe.transfers.create` to connected account
5. Commission: platform keeps its share, hotel commission tracked for manual payout

### Pay on Site (card guarantee)

1. Guest checks out → reservation created with `payment_mode = 'pay_on_site'`
2. Stripe SetupIntent created (deferred pattern) → guest provides card details
3. Card guaranteed → booking created, guest pays supplier directly on-site
4. After experience → auto-complete, commission logged to `commission_invoices`
5. Late cancel / no-show → off-session charge via saved PaymentMethod
6. Monthly cron generates commission invoices for pay-on-site suppliers

## Webhook Endpoints

### Widget webhook (`/api/webhooks/stripe`)

| Event | Handler | What it does |
|---|---|---|
| `payment_intent.succeeded` | Creates booking, sends confirmation emails (guest + supplier + hotel) | Main payment flow |
| `payment_intent.payment_failed` | Sends failure email to guest | Error notification |
| `charge.refunded` | Sends refund confirmation to guest | Refund flow |
| `account.updated` | Updates `partners.stripe_onboarding_complete` and `payment_mode` | Connect onboarding |
| `account.application.deauthorized` | Resets partner's Stripe connection | Account disconnect |
| `transfer.created` | Sends "payment sent" email to supplier | Payout notification |

Auth: Stripe signature verification via `STRIPE_WEBHOOK_SECRET`.

### Edge Function webhook (`stripe-webhooks`)

Deployed on Supabase (separate from widget). Handles:
- `account.updated` — Updates partner onboarding status
- `account.application.deauthorized` — Resets Stripe connection

Note: There's overlap with the widget webhook for `account.updated`. The edge function handles it at the Supabase level; the widget webhook handles it in the Next.js app.

## Edge Functions

### `create-connect-account`

- **Location:** `apps/dashboard/supabase/functions/create-connect-account/index.ts`
- **Auth:** Bearer JWT (validates user_partners access)
- **Flow:** Check if partner has `stripe_account_id` → if not, create Express account → save to DB → return onboarding link
- **Returns:** `{ url: string }` (Stripe onboarding URL)
- **Environment:** `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### `stripe-webhooks`

- **Location:** `apps/dashboard/supabase/functions/stripe-webhooks/index.ts`
- **Auth:** Stripe signature verification
- **Environment:** `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Commission Split

Default rates (from `@traverum/shared/constants`):
- Supplier: 80%
- Hotel: 12%
- Platform: 8%

Self-owned (supplier = hotel): Supplier 92%, Platform 8%.

Split calculated with `Math.round()`. Rounding remainder goes to platform.

Stored per-booking in `bookings.supplier_amount_cents`, `hotel_amount_cents`, `platform_amount_cents`.

Configurable per-distribution in `distributions.commission_supplier/hotel/platform`.

## Key Stripe Helpers

Located in `apps/widget/src/lib/stripe/`:
- `createStripeCustomer(email, name)` — Creates customer with idempotency
- `createSetupIntent(customerId)` — Deferred setup for card guarantee
- `chargeOffSession(customerId, paymentMethodId, amount)` — Off-session charge for cancellations/no-shows
- `getPaymentMethodFromSetupIntent(setupIntentId)` — Retrieve saved card
- `calculateCommissionSplit(totalCents, rates)` — Split with rounding

## Environment Variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side API calls (`sk_live_*` prod, `sk_test_*` staging) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Payment Element / SetupIntent (`pk_live_*` / `pk_test_*`) |

## Test Cards

| Number | Behavior |
|---|---|
| `4242424242424242` | Succeeds immediately |
| `4000002500003155` | Requires auth on setup, succeeds off-session |
| `4000002760003184` | Requires auth on setup, fails off-session (authentication_required) |
| `4000008260003178` | Requires auth on setup, fails off-session (insufficient_funds) |
| `4000000000009995` | Always fails (insufficient_funds) |
