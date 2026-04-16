'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      // Only create profiles for identified users (guests who complete checkout)
      person_profiles: 'identified_only',
      // We fire $pageview manually — Next.js App Router doesn't trigger full page reloads
      capture_pageview: false,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          // Always mask passwords, never mask email (useful to debug form drop-offs)
          password: true,
        },
      },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
