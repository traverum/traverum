# Stripe Payment Element (Web/React)

Source: https://docs.stripe.com/payments/payment-element

The Payment Element is an embeddable UI component that renders a dynamic payment form. It automatically shows relevant payment methods based on the customer's location, currency, and Stripe Dashboard settings.

## Why Payment Element (not Card Element)

- **Card Element is legacy** — Stripe recommends migrating to Payment Element
- Accepts multiple payment methods through a single integration
- Dynamic payment method selection based on customer context
- Built-in SCA/3DS handling
- Customizable via the Appearance API

## Installation

```bash
npm install --save @stripe/react-stripe-js @stripe/stripe-js
```

## React integration

### Load Stripe outside of render

```tsx
import { loadStripe } from '@stripe/stripe-js'

// IMPORTANT: Call loadStripe outside of a component's render
// to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
```

### Elements provider

Wrap your checkout component in the `Elements` provider:

```tsx
import { Elements } from '@stripe/react-stripe-js'

function CheckoutPage() {
  const options = {
    mode: 'setup' as const,  // or 'payment' for charges
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

### PaymentElement component

```tsx
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    // Validate the form
    const { error: submitError } = await elements.submit()
    if (submitError) {
      // Show error
      return
    }

    // Create intent on server, get clientSecret
    // Then confirm with Stripe
    const { error } = await stripe.confirmSetup({
      elements,
      clientSecret,
      confirmParams: { return_url: '...' },
      redirect: 'if_required',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Reserve
      </button>
    </form>
  )
}
```

## Layout options

The Payment Element supports two layout types:

### Accordion (default)

```tsx
<PaymentElement
  options={{
    layout: {
      type: 'accordion',
      defaultCollapsed: false,
      radios: 'always',
      spacedAccordionItems: false,
    },
  }}
/>
```

### Tabs

```tsx
<PaymentElement
  options={{
    layout: {
      type: 'tabs',
      defaultCollapsed: false,
    },
  }}
/>
```

## Elements options reference

| Property | Type | Description | Required |
|---|---|---|---|
| `mode` | `'payment'` / `'setup'` / `'subscription'` | Intent type | Yes |
| `currency` | `string` | Currency code (e.g., `'eur'`) | Yes |
| `amount` | `number` | Amount in cents (for Apple Pay, Google Pay UI) | For `payment`/`subscription` |
| `appearance` | `Appearance` | Appearance API config | No |
| `setupFutureUsage` | `'off_session'` / `'on_session'` | Save for future use | No |
| `paymentMethodTypes` | `string[]` | Specific payment methods (prefer Dashboard config) | No |

## Dynamically updating

Update Elements options when checkout details change (e.g., discount code):

```tsx
function App() {
  const [amount, setAmount] = useState(1099)

  const options = {
    mode: 'payment' as const,
    amount,
    currency: 'eur',
    appearance: { /* ... */ },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  )
}
```

When `amount` changes via `setAmount`, the Elements provider re-renders with the new value.

## Important notes

- Always load Stripe.js from `js.stripe.com` — never bundle it yourself (PCI compliance)
- HTTPS required for production (test works without it)
- Don't place Payment Element inside another iframe (conflicts with redirect payment methods)
- The `loadStripe` call must be outside component render
- `elements.submit()` must be called before `stripe.confirmSetup()` or `stripe.confirmPayment()`
- Use `redirect: 'if_required'` to avoid unnecessary redirects for card payments

## Hooks reference

| Hook | Returns | Use for |
|---|---|---|
| `useStripe()` | `Stripe` instance | `confirmSetup`, `confirmPayment` |
| `useElements()` | `Elements` instance | `submit()`, `getElement()` |
