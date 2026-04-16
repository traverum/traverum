'use client'

// Fires booking_confirmed once when the guest lands on the confirmation page.
// Placed inside the confirmation/reservation server pages.

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface PostHogBookingConfirmedProps {
  bookingId: string
  experienceId: string
  experienceTitle: string
  totalCents: number
  currency: string
  isRequest: boolean
}

export function PostHogBookingConfirmed({
  bookingId,
  experienceId,
  experienceTitle,
  totalCents,
  currency,
  isRequest,
}: PostHogBookingConfirmedProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    posthog.capture('booking_confirmed', {
      booking_id: bookingId,
      experience_id: experienceId,
      experience_title: experienceTitle,
      total_cents: totalCents,
      currency,
      booking_path: isRequest ? 'request' : 'session',
      // revenue property for PostHog revenue tracking
      $revenue: totalCents / 100,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // fire once on mount only

  return null
}
