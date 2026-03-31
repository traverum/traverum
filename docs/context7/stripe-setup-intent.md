# Stripe Setup Intents API

Source: https://docs.stripe.com/payments/setup-intents

Save a customer's payment method for future charges without making an initial payment.

## When to use

- Save a card as a guarantee (charge only if cancellation/no-show)
- Onboard customers now, charge later
- Recurring payments with variable amounts
- One-time payments with amount determined after service

## Setup Intent lifecycle

```
requires_payment_method → requires_confirmation → requires_action (3DS) → processing → succeeded
```

- `requires_payment_method` — Initial state, waiting for card details
- `requires_confirmation` — Card details collected, ready to confirm
- `requires_action` — SCA/3DS authentication required
- `succeeded` — Card saved and ready for future charges

## Creating a SetupIntent (server-side)

```typescript
const setupIntent = await stripe.setupIntents.create(
  {
    customer: customerId,
    usage: 'off_session', // or 'on_session'
    metadata: { reservationId },
    automatic_payment_methods: { enabled: true },
  },
  { idempotencyKey: `setup_${reservationId}` }
)
```

### `usage` parameter

| Value | Meaning | When to use |
|---|---|---|
| `off_session` | Card may be charged without customer present | **Our default** — cancellation fees, no-show charges |
| `on_session` | Card only used when customer is in checkout | Higher auth rates but can't charge off-session |

Setting `usage: 'off_session'` tells the card network to optimize for future off-session charges. This may trigger SCA during setup (good — authenticates upfront so off-session charges succeed later).

## Deferred intent pattern

Render the Payment Element **before** creating a SetupIntent. See `stripe-deferred-setup-intent.md` for the full React implementation.

Key flow:
1. `Elements` provider renders with `{ mode: 'setup', currency: 'eur' }` — no server call
2. Guest fills card details
3. `elements.submit()` validates the form
4. Server creates Customer + SetupIntent, returns `clientSecret`
5. `stripe.confirmSetup({ elements, clientSecret })` completes setup
6. Server verifies SetupIntent `succeeded`

## Confirming a SetupIntent (client-side)

```typescript
// With Payment Element (deferred pattern)
const { error } = await stripe.confirmSetup({
  elements,
  clientSecret,
  confirmParams: {
    return_url: 'https://...',
  },
  redirect: 'if_required',
})

// With Card Element (legacy — don't use for new code)
const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
  payment_method: {
    card: elements.getElement(CardElement),
    billing_details: { name: 'Guest Name' },
  },
})
```

## Retrieving the saved payment method

```typescript
const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
const paymentMethodId = setupIntent.payment_method as string
// The payment method is automatically attached to the customer
```

## Charging the saved card later

See `stripe-off-session-charging.md` for the full flow with error handling.

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountCents,
  currency: 'eur',
  customer: customerId,
  payment_method: paymentMethodId,
  off_session: true,
  confirm: true,
})
```

## Compliance — get permission to save

When saving cards for off-session use (especially in Europe under SCA):

1. Include text explaining how the card will be used
2. Get explicit consent (checkbox + agreement text)
3. Keep a record of the agreement

Example mandate text:
> "I authorize [Business Name] to save my card and charge it according to the cancellation policy if I cancel outside the free cancellation window or don't show up."

## Test cards

| Number | Behavior |
|---|---|
| `4242424242424242` | Setup succeeds, off-session charge succeeds |
| `4000002500003155` | Requires 3DS on setup, off-session charge succeeds |
| `4000002760003184` | Requires 3DS on setup, off-session charge requires auth again |
| `4000008260003178` | Requires 3DS on setup, off-session charge fails (insufficient funds) |
