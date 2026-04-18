'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

interface PostHogExperienceViewedProps {
  experienceId: string
  experienceTitle: string
  supplierId: string
}

export function PostHogExperienceViewed({
  experienceId,
  experienceTitle,
  supplierId,
}: PostHogExperienceViewedProps) {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    posthog.capture('experience_viewed', {
      experience_id: experienceId,
      experience_title: experienceTitle,
      supplier_id: supplierId,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // fire once on mount only

  return null
}
