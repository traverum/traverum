'use client'

// Registers hotel identity as PostHog super-properties so every subsequent
// event fired during this session is automatically tagged with the hotel.
// Rendered server-side in [hotelSlug] pages; runs once on mount client-side.

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface PostHogHotelContextProps {
  hotelConfigId: string
  hotelSlug: string
  hotelName: string
  /** 'white-label' = guest arrived via hotel embed, 'direct' = Veyond direct */
  channel: 'white-label' | 'direct'
}

export function PostHogHotelContext({
  hotelConfigId,
  hotelSlug,
  hotelName,
  channel,
}: PostHogHotelContextProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    // posthog.register() attaches these to every event for the session lifetime
    posthog.register({
      hotel_config_id: hotelConfigId,
      hotel_slug: hotelSlug,
      hotel_name: hotelName,
      channel,
    })
  }, [posthog, hotelConfigId, hotelSlug, hotelName, channel])

  return null
}
