import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    borderRadius: '6px',
    colorPrimary: '#5D4631',
    colorText: '#37352F',
    colorDanger: '#B8866B',
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(55, 53, 47, 0.12)',
      boxShadow: 'none',
      padding: '10px 16px',
    },
    '.Input:focus': {
      borderColor: '#5D4631',
      boxShadow: '0 0 0 2px rgba(93, 70, 49, 0.2)',
    },
  },
}
