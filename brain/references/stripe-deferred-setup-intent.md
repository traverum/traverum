# Stripe Deferred Setup Intent Pattern (Web/React)

Source: https://docs.stripe.com/payments/accept-a-payment-deferred?type=setup

Render the Payment Element **before** creating a SetupIntent. The card form loads immediately without a server call. The SetupIntent is created on the server only when the guest submits.

## Why this pattern

- No client secret needed before having guest details
- Card form renders instantly (better UX)
- Server creates SetupIntent only after validation
- Works with SCA/3DS — Stripe handles authentication automatically

## Limitations

- BLIK and ACSS pre-authorized debits not supported with client-side deferred intent
- `customer_balance` requires a Customer on the intent — not applicable to our flow

## React setup

### Install dependencies

```bash
npm install --save @stripe/react-stripe-js @stripe/stripe-js
```

### Elements provider with setup mode

Call `loadStripe` **outside** of a component's render to avoid recreating the Stripe object on every render.

```tsx
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutPage() {
  const options = {
    mode: 'setup' as const,
    currency: 'eur',
    appearance: { /* see stripe-appearance-api.md */ },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  )
}
```

### Payment Element component

```tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    // Step 1: Validate the card form
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Validation failed')
      setIsSubmitting(false)
      return
    }

    // Step 2: Create SetupIntent on the server
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* reservation data */ }),
    })
    const { clientSecret, reservationId } = await res.json()

    // Step 3: Confirm the SetupIntent with the collected card details
    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/reservation/${reservationId}/confirmation`,
      },
      redirect: 'if_required', // Only redirect for payment methods that require it (not cards)
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Setup failed')
      setIsSubmitting(false)
      return
    }

    // Step 4: Confirm the guarantee on the server
    await fetch(`/api/reservations/${reservationId}/confirm-guarantee`, {
      method: 'POST',
    })

    // Step 5: Redirect to confirmation
    window.location.href = `/reservation/${reservationId}/confirmation`
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit" disabled={!stripe || isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Reserve'}
      </button>
    </form>
  )
}
```

## Server-side: Create SetupIntent

```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Create customer first
const customer = await stripe.customers.create(
  { email: guestEmail, name: guestName },
  { idempotencyKey: `customer_${reservationId}` }
)

// Create SetupIntent attached to customer
const setupIntent = await stripe.setupIntents.create(
  {
    customer: customer.id,
    usage: 'off_session', // Important: enables off-session charges later
    metadata: { reservationId },
  },
  { idempotencyKey: `setup_${reservationId}` }
)

// Return client secret to the client
return { clientSecret: setupIntent.client_secret, reservationId }
```

## Server-side: Verify SetupIntent succeeded

```typescript
const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

if (setupIntent.status !== 'succeeded') {
  throw new Error(`SetupIntent not succeeded: ${setupIntent.status}`)
}

// The payment method is now saved and can be charged later
const paymentMethodId = setupIntent.payment_method as string
```

## Key parameters

| Parameter | Value | Why |
|---|---|---|
| `mode` | `'setup'` | No charge — just save the card |
| `currency` | `'eur'` | Determines which payment methods are shown |
| `usage` | `'off_session'` | Optimizes for future off-session charges (SCA) |
| `redirect` | `'if_required'` | Cards don't redirect; other methods might |

## Elements options for setup mode

```typescript
const options = {
  mode: 'setup' as const,
  currency: 'eur',
  appearance: { /* ... */ },
  // setupFutureUsage is implicit when mode is 'setup'
}
```

When `mode` is `'setup'`, the Elements provider knows this is for saving a payment method. No `amount` is required.
