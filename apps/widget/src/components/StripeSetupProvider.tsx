'use client'

import { Elements } from '@stripe/react-stripe-js'
import { stripePromise, STRIPE_APPEARANCE } from '@/lib/stripe-client'

interface StripeSetupProviderProps {
  children: React.ReactNode
}

export function StripeSetupProvider({ children }: StripeSetupProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'setup',
        currency: 'eur',
        paymentMethodTypes: ['card'],
        appearance: STRIPE_APPEARANCE,
      }}
    >
      {children}
    </Elements>
  )
}
