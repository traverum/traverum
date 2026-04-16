'use client'

// PostHog does not auto-detect page changes in Next.js App Router
// because navigation happens client-side without full reloads.
// This component listens to route changes and fires $pageview manually.

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!pathname || !posthog) return

    let url = window.location.origin + pathname
    const search = searchParams.toString()
    if (search) url += `?${search}`

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
