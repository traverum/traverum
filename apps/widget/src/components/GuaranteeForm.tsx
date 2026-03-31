'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CardGuaranteeSection, type CardGuaranteeHandle } from './CardGuaranteeSection'

interface GuaranteeFormProps {
  reservationId: string
  basePath: string
  cancellationPolicyText: string
  returnUrl?: string | null
}

export function GuaranteeForm({
  reservationId,
  basePath,
  cancellationPolicyText,
  returnUrl,
}: GuaranteeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const stripeRef = useRef<CardGuaranteeHandle>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!policyAccepted) {
      setError('Please accept the cancellation policy to continue.')
      return
    }

    const handle = stripeRef.current
    if (!handle?.stripe || !handle?.elements) {
      setError('Card form is not ready. Please wait a moment and try again.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const setupRes = await fetch(`/api/reservations/${reservationId}/setup-intent`, {
        method: 'POST',
      })
      const setupResult = await setupRes.json()
      if (!setupRes.ok) {
        throw new Error(setupResult.error || 'Failed to create setup intent')
      }

      // If the card was already saved on a previous attempt (e.g. booking
      // creation failed after Stripe confirmation), skip straight to booking.
      if (!setupResult.alreadyConfirmed) {
        const { error: submitError } = await handle.elements.submit()
        if (submitError) {
          throw new Error(submitError.message ?? 'Card validation failed')
        }

        const reservationUrl = `${window.location.origin}${basePath}/reservation/${reservationId}`

        const { error: confirmError } = await handle.stripe.confirmSetup({
          elements: handle.elements,
          clientSecret: setupResult.clientSecret,
          confirmParams: {
            return_url: reservationUrl,
          },
          redirect: 'if_required',
        })

        if (confirmError) {
          throw new Error(confirmError.message ?? 'Failed to save card')
        }
      }

      const confirmRes = await fetch(`/api/reservations/${reservationId}/confirm-guarantee`, {
        method: 'POST',
      })
      const confirmResult = await confirmRes.json()
      if (!confirmRes.ok) {
        throw new Error(confirmResult.error || 'Failed to confirm reservation')
      }

      const next = returnUrl
        ? `${basePath}/reservation/${reservationId}?returnUrl=${encodeURIComponent(returnUrl)}`
        : `${basePath}/reservation/${reservationId}`
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-body">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-button text-sm border border-destructive/20">
          {error}
        </div>
      )}

      <CardGuaranteeSection
        ref={stripeRef}
        disabled={isSubmitting}
        cancellationPolicyText={cancellationPolicyText}
        policyAccepted={policyAccepted}
        onPolicyChange={setPolicyAccepted}
      />

      <button
        type="submit"
        disabled={isSubmitting || !policyAccepted}
        className={cn(
          'w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          isSubmitting && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        By confirming, you agree to our terms of service and cancellation policy.
      </p>
    </form>
  )
}
