'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Stripe, StripeElements } from '@stripe/stripe-js'

export interface CardGuaranteeHandle {
  stripe: Stripe | null
  elements: StripeElements | null
}

interface CardGuaranteeSectionProps {
  disabled?: boolean
  cancellationPolicyText: string
  policyAccepted: boolean
  onPolicyChange: (accepted: boolean) => void
}

export const CardGuaranteeSection = forwardRef<CardGuaranteeHandle, CardGuaranteeSectionProps>(
  function CardGuaranteeSection({ disabled, cancellationPolicyText, policyAccepted, onPolicyChange }, ref) {
    const stripe = useStripe()
    const elements = useElements()

    useImperativeHandle(ref, () => ({ stripe, elements }), [stripe, elements])

    return (
      <div className="space-y-4">
        <div className="border border-border rounded-card overflow-hidden">
          <div className="px-4 py-3 bg-background-alt border-b border-border">
            <p className="text-xs font-medium text-foreground tracking-wide uppercase">Cancellation terms</p>
          </div>
          <div className="px-4 py-3">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-baseline gap-2">
                <span className="shrink-0 w-1 h-1 mt-1.5 rounded-full bg-muted-foreground" />
                <span className="text-foreground">{cancellationPolicyText}</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="shrink-0 w-1 h-1 mt-1.5 rounded-full bg-muted-foreground" />
                <span className="text-foreground">Late cancellation or no-show: full experience price charged to your card</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="shrink-0 w-1 h-1 mt-1.5 rounded-full bg-muted-foreground" />
                <span className="text-foreground">Provider cancels: you are never charged</span>
              </li>
            </ul>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={policyAccepted}
            onChange={(e) => onPolicyChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
            disabled={disabled}
          />
          <span className="text-xs text-foreground leading-relaxed">
            I understand my card may be charged if I cancel late or don&apos;t attend.
          </span>
        </label>

        {policyAccepted && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-foreground mb-2">
              Card details
            </label>
            <PaymentElement
              options={{
                layout: { type: 'accordion', defaultCollapsed: false, spacedAccordionItems: false },
                wallets: { link: 'never' },
              }}
            />
          </div>
        )}
      </div>
    )
  }
)
