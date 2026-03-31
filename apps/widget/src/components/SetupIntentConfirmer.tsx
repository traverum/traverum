'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface SetupIntentConfirmerProps {
  reservationId: string
}

/**
 * Handles the rare case where Stripe redirects the user after confirmSetup().
 * When the user lands on the reservation page with a `setup_intent` query param,
 * this component calls confirm-guarantee to finalize the booking, then refreshes.
 */
export function SetupIntentConfirmer({ reservationId }: SetupIntentConfirmerProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  const setupIntentParam = searchParams.get('setup_intent')

  useEffect(() => {
    if (!setupIntentParam || confirming) return
    setConfirming(true)

    fetch(`/api/reservations/${reservationId}/confirm-guarantee`, { method: 'POST' })
      .then((r) => r.json())
      .then(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('setup_intent')
        url.searchParams.delete('setup_intent_client_secret')
        url.searchParams.delete('redirect_status')
        router.replace(url.pathname + url.search)
        router.refresh()
      })
      .catch((err) => {
        console.error('Failed to confirm guarantee after redirect:', err)
        setConfirming(false)
      })
  }, [setupIntentParam, reservationId, confirming, router])

  if (!setupIntentParam) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-card border border-border p-8 text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-foreground font-medium">Confirming your reservation...</p>
        <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
      </div>
    </div>
  )
}
