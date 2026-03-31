# Stripe Off-Session Charging

Source: https://docs.stripe.com/payments/save-and-reuse

Charge a saved card when the customer is not in your checkout flow. Used for cancellation fees and no-show charges.

## Prerequisites

1. Card was saved via Setup Intent with `usage: 'off_session'`
2. Customer gave explicit consent (cancellation policy checkbox)
3. You have the `customer_id` and `payment_method_id` stored

## Creating an off-session charge

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function chargeOffSession(params: {
  customerId: string
  paymentMethodId: string
  amountCents: number
  currency: string
  bookingId: string
  reason: string // 'cancellation_fee' | 'no_show'
}) {
  const { customerId, paymentMethodId, amountCents, currency, bookingId, reason } = params

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: { bookingId, reason },
      },
      { idempotencyKey: `charge_${bookingId}_${reason}` }
    )

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    }
  } catch (err: any) {
    return handleChargeError(err, bookingId)
  }
}
```

## Error handling

Off-session charges fail more often than on-session ones because the customer can't authenticate.

```typescript
function handleChargeError(err: any, bookingId: string) {
  // SCA authentication required — customer must come back
  if (err.code === 'authentication_required') {
    const paymentIntentId = err.raw?.payment_intent?.id
    return {
      success: false,
      reason: 'authentication_required' as const,
      paymentIntentId,
      // Action: send guest an email with a link to authenticate
      // Use the PaymentIntent's client_secret with stripe.confirmCardPayment()
    }
  }

  // Card declined (insufficient funds, expired, generic decline, etc.)
  if (err.type === 'StripeCardError') {
    return {
      success: false,
      reason: 'card_declined' as const,
      declineCode: err.raw?.decline_code || err.code,
      // Action: log failure, fall back to monthly invoice
    }
  }

  // Unexpected error — rethrow
  throw err
}
```

## Decline codes reference

| Decline code | Meaning | Recovery |
|---|---|---|
| `authentication_required` | Issuer requires 3DS | Send guest auth link |
| `insufficient_funds` | Not enough money | Fall back to invoice |
| `expired_card` | Card expired since setup | Fall back to invoice |
| `card_declined` | Generic decline | Fall back to invoice |
| `processing_error` | Temporary processing issue | Retry once, then invoice |

## Recovery flow for `authentication_required`

When the off-session charge fails with `authentication_required`, the PaymentIntent is in `requires_payment_method` state. You can recover by:

1. Sending the guest an email with a link to a payment page
2. On that page, use `stripe.confirmCardPayment()` with the failed PaymentIntent's client secret

```typescript
// Client-side recovery
const result = await stripe.confirmCardPayment(failedIntent.client_secret, {
  payment_method: failedIntent.last_payment_error.payment_method.id,
})

if (result.error) {
  // Show error to guest
} else if (result.paymentIntent.status === 'succeeded') {
  // Charge succeeded after authentication
}
```

## Retrieving the payment method from a SetupIntent

```typescript
async function getPaymentMethodFromSetupIntent(setupIntentId: string) {
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  if (setupIntent.status !== 'succeeded') {
    throw new Error(`SetupIntent ${setupIntentId} status: ${setupIntent.status}`)
  }
  return setupIntent.payment_method as string
}
```

## SCA/mandate compliance

For off-session charges in Europe, you must have collected explicit consent. Your checkout must include:

- Customer's agreement to initiate charges on their behalf
- How the charge amount is determined (cancellation fee percentage)
- Cancellation policy details

The cancellation policy checkbox + agreement text in the checkout form satisfies this.

## Test cards

| Number | Behavior |
|---|---|
| `4242424242424242` | Succeeds immediately |
| `4000002500003155` | Requires auth on setup, succeeds off-session |
| `4000002760003184` | Requires auth on setup, fails off-session (`authentication_required`) |
| `4000008260003178` | Requires auth on setup, fails off-session (`insufficient_funds`) |
| `4000000000009995` | Always fails (`insufficient_funds`) |
