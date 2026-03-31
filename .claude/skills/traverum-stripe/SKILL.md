---
name: traverum-stripe
description: >-
  Traverum-specific Stripe patterns after official guidance: idempotency key
  conventions, off-session error handling, pay-on-site / card guarantee,
  docs/context7 links. Use together with stripe-best-practices-official
  (read vendor/stripe-ai skill first).
  Triggers on: Stripe, payment, checkout, setup intent, payment element,
  off-session, card guarantee, cancellation charge, commission, transfer.
---

# Traverum Stripe patterns (project overlay)

**Read first:** `stripe-best-practices-official` — then open the files it points to under `vendor/stripe-ai/skills/stripe-best-practices/` (submodule, synced with [stripe/ai](https://github.com/stripe/ai)).

This file adds **Traverum-only** conventions on top of Stripe’s official skill. Do not treat this as a substitute for the upstream SKILL + `references/`.

Latest Stripe API version: **2026-02-25.clover**. Use the latest API version and SDK unless there's a specific reason not to.

## Integration routing

| Building…                          | Recommended API              |
|------------------------------------|------------------------------|
| One-time payments                  | Checkout Sessions            |
| Custom payment form with embedded UI | Checkout Sessions + Payment Element |
| Saving a payment method for later  | Setup Intents                |
| Connect platform or marketplace    | Accounts v2 (`/v2/core/accounts`) |
| Subscriptions or recurring billing | Billing APIs + Checkout Sessions |

## API hierarchy

Use the **Checkout Sessions API** for on-session payments. It handles taxes, discounts, shipping, and adaptive pricing automatically.

Use the **PaymentIntents API** for off-session payments or when you need to model checkout state independently.

Use the **Setup Intents API** to save a payment method without an initial charge.

**Only use Checkout Sessions, PaymentIntents, SetupIntents, or higher-level solutions (Invoicing, Payment Links, subscription APIs).**

## Integration surfaces — order of preference

1. **Payment Links** — No-code. Best for simple products.
2. **Checkout** — Stripe-hosted or embedded form. Best for most web apps.
3. **Payment Element** — Embedded UI component for advanced customization.

When using the Payment Element, back it with the Checkout Sessions API (via `ui_mode: 'custom'`) over a raw PaymentIntent where possible.

## Saving payment methods

Use the **Setup Intents API** to save a payment method for later use.

**Never use the Sources API** to save cards — it's deprecated. Setup Intents is the correct approach.

## Payment Element guidance

- **Never use the legacy Card Element** or the Payment Element in card-only mode.
- For inspecting card details before payment (surcharging, review pages): use **Confirmation Tokens**, not `createPaymentMethod` or `createToken`.
- Enable **dynamic payment methods** in the Stripe Dashboard rather than passing specific `payment_method_types`. Stripe automatically selects payment methods based on the customer's location.

## Deprecated APIs — never recommend

| API          | Status     | Use instead                         |
|--------------|------------|-------------------------------------|
| Charges API  | Never use  | Checkout Sessions or PaymentIntents |
| Sources API  | Deprecated | Setup Intents                       |
| Tokens API   | Outdated   | Setup Intents or Checkout Sessions  |
| Card Element | Legacy     | Payment Element                     |

## Idempotency

All Stripe `POST` requests accept an `Idempotency-Key` header. Use it for every mutating call:

- Generate a unique key per logical operation (V4 UUID or `${entityType}_${entityId}_${operation}`)
- Stripe saves the result for 24 hours — subsequent requests with the same key return the cached result
- Keys are up to 255 characters
- If incoming parameters don't match the original request, Stripe returns an error
- `GET` and `DELETE` are inherently idempotent — don't send keys for those

```typescript
const setupIntent = await stripe.setupIntents.create(
  { customer: customerId, usage: 'off_session' },
  { idempotencyKey: `setup_${reservationId}` }
)
```

## Off-session charging

When charging a saved card without the customer present:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountCents,
  currency: 'eur',
  customer: customerId,
  payment_method: paymentMethodId,
  off_session: true,
  confirm: true,
}, {
  idempotencyKey: `charge_${bookingId}_cancellation`
})
```

### Error handling for off-session charges

Off-session charges can fail. Handle these cases explicitly:

| Error code | Meaning | Action |
|---|---|---|
| `authentication_required` | Card issuer requires SCA | Notify guest to authenticate (email with link) |
| `card_declined` / `insufficient_funds` | Card can't be charged | Log failure, fall back to invoice |
| `expired_card` | Card expired since setup | Log failure, fall back to invoice |

```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
  })
  return { success: true, paymentIntentId: paymentIntent.id }
} catch (err: any) {
  if (err.code === 'authentication_required') {
    // Guest must authenticate — send email with payment link
    return { success: false, reason: 'authentication_required', paymentIntentId: err.raw?.payment_intent?.id }
  }
  if (err.type === 'StripeCardError') {
    // Card declined, insufficient funds, expired, etc.
    return { success: false, reason: err.code, declineCode: err.raw?.decline_code }
  }
  throw err // Unexpected error — let it bubble
}
```

## Connect charge types

For our integration (separate charges and transfers):

- **Don't mix charge types** within a single integration
- Use `source_transaction` on transfers in test mode
- Use `on_behalf_of` to control merchant of record

## SCA/mandate compliance (Europe)

When saving cards for off-session use, you must:

1. Get explicit customer consent with terms covering:
   - Agreement to initiate charges on their behalf
   - How charge amounts are determined (e.g., cancellation fee percentage)
   - Cancellation policy
2. Keep a record of the customer's written agreement
3. The cancellation policy checkbox in the checkout form satisfies this requirement

## Test cards for Setup Intent flows

| Number             | Behavior |
|--------------------|----------|
| `4242424242424242` | Succeeds immediately |
| `4000002500003155` | Requires auth on setup, succeeds off-session |
| `4000002760003184` | Requires auth on setup, fails off-session with `authentication_required` |
| `4000008260003178` | Requires auth on setup, fails off-session with `insufficient_funds` |
| `4000000000009995` | Always fails with `insufficient_funds` |

## Reference docs

- [Setup Intents API](https://docs.stripe.com/payments/setup-intents)
- [Deferred intent pattern](https://docs.stripe.com/payments/accept-a-payment-deferred?type=setup)
- [Save and reuse cards](https://docs.stripe.com/payments/save-and-reuse)
- [Off-session payments](https://docs.stripe.com/payments/off-session-payments)
- [Appearance API](https://docs.stripe.com/elements/appearance-api)
- [Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [Connect charges](https://docs.stripe.com/connect/charges)
- [Error handling](https://docs.stripe.com/error-handling)

## Traverum-specific patterns

See also:
- `docs/context7/stripe-deferred-setup-intent.md` — Deferred pattern for card guarantees
- `docs/context7/stripe-off-session-charging.md` — Off-session charge flow with error handling
- `docs/context7/stripe-appearance-api.md` — Styling Payment Element (includes var() limitation)
- `docs/context7/stripe-idempotency.md` — Idempotency key patterns
- `docs/context7/stripe-separate-charges-and-transfers.md` — Connect fund flows
