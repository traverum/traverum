---
name: traverum-stripe
description: >-
  Traverum-specific Stripe patterns after official guidance: idempotency key
  conventions, off-session error handling, pay-on-site / card guarantee,
  docs/context7 links. Use together with stripe-best-practices-official
  (read that skill first).
  Triggers on: Stripe, payment, checkout, setup intent, payment element,
  off-session, card guarantee, cancellation charge, commission, transfer.
---

# Traverum Stripe patterns (project overlay)

**Read first:** `.agents/skills/stripe-best-practices-official/` — the official Stripe skill with `references/` (copied from [stripe/ai](https://github.com/stripe/ai)). To update: re-download from the repo and copy `skills/stripe-best-practices/` over it.

This file adds **Traverum-only** conventions. Do not treat it as a substitute for the official skill + references.

## Idempotency key conventions

All Stripe `POST` calls must use idempotency keys. Our naming pattern:

| Operation | Key pattern | Example |
|---|---|---|
| Create customer for reservation | `customer_{reservationId}` | `customer_abc123` |
| Create SetupIntent for reservation | `setup_{reservationId}` | `setup_abc123` |
| Cancellation fee charge | `charge_{bookingId}_cancellation` | `charge_def456_cancellation` |
| No-show charge | `charge_{bookingId}_no_show` | `charge_def456_no_show` |
| Transfer to connected account | `transfer_{bookingId}_{type}` | `transfer_def456_supplier` |

```typescript
const setupIntent = await stripe.setupIntents.create(
  { customer: customerId, usage: 'off_session' },
  { idempotencyKey: `setup_${reservationId}` }
)
```

## Off-session charge error handling

Off-session charges (cancellation fees, no-show charges) can fail. Handle explicitly:

| Error code | Meaning | Action |
|---|---|---|
| `authentication_required` | Card issuer requires SCA | Notify guest to authenticate (email with link) |
| `card_declined` / `insufficient_funds` | Card can't be charged | Log failure, fall back to monthly invoice |
| `expired_card` | Card expired since setup | Log failure, fall back to monthly invoice |

```typescript
try {
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
  return { success: true, paymentIntentId: paymentIntent.id }
} catch (err: any) {
  if (err.code === 'authentication_required') {
    return { success: false, reason: 'authentication_required', paymentIntentId: err.raw?.payment_intent?.id }
  }
  if (err.type === 'StripeCardError') {
    return { success: false, reason: err.code, declineCode: err.raw?.decline_code }
  }
  throw err
}
```

## SCA/mandate compliance (Europe)

When saving cards for off-session use, the checkout must include:

1. Customer's agreement to initiate charges on their behalf
2. How charge amounts are determined (cancellation fee percentage)
3. Cancellation policy

The cancellation policy checkbox in the checkout form satisfies this.

## Connect: separate charges and transfers

- **Don't mix charge types** within a single integration
- Use `source_transaction` on transfers in test mode
- Use `on_behalf_of` to control merchant of record
- See `docs/context7/stripe-separate-charges-and-transfers.md` for the full reference

## Test cards for Setup Intent flows

| Number | Behavior |
|---|---|
| `4242424242424242` | Succeeds immediately |
| `4000002500003155` | Requires auth on setup, succeeds off-session |
| `4000002760003184` | Requires auth on setup, fails off-session (`authentication_required`) |
| `4000008260003178` | Requires auth on setup, fails off-session (`insufficient_funds`) |
| `4000000000009995` | Always fails (`insufficient_funds`) |

## Context7 docs (project-specific Stripe references)

- `docs/context7/stripe-deferred-setup-intent.md` — Deferred pattern for card guarantees (React)
- `docs/context7/stripe-off-session-charging.md` — Off-session charge flow with full error handling
- `docs/context7/stripe-appearance-api.md` — Styling Payment Element (includes `var()` limitation)
- `docs/context7/stripe-idempotency.md` — Idempotency key patterns
- `docs/context7/stripe-setup-intent.md` — Setup Intent lifecycle and compliance
- `docs/context7/stripe-payment-element.md` — Payment Element React integration
- `docs/context7/stripe-separate-charges-and-transfers.md` — Connect fund flows
