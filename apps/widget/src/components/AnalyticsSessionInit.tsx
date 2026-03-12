'use client'

import { useEffect } from 'react'
import { initAnalyticsSession } from '@/lib/analytics.client'

interface AnalyticsSessionInitProps {
  source?: string | null
}

export function AnalyticsSessionInit({ source }: AnalyticsSessionInitProps) {
  useEffect(() => {
    initAnalyticsSession(source)
  }, [source])

  return null
}
