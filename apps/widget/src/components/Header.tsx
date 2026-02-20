'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface HeaderProps {
  hotelName: string
  logoUrl: string | null
  hotelSlug: string
  showBack?: boolean
  backTo?: string
  returnUrl?: string | null
}

export function Header({ hotelName, logoUrl, hotelSlug, showBack = false, backTo, returnUrl }: HeaderProps) {
  const router = useRouter()

  const homeHref = returnUrl
    ? `/${hotelSlug}?embed=full&returnUrl=${encodeURIComponent(returnUrl)}`
    : `/${hotelSlug}?embed=full`

  const isSafeHttpUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleBackClick = () => {
    // If backTo is provided, use it (for detail page -> full list)
    if (backTo) {
      if (isSafeHttpUrl(backTo)) {
        window.location.assign(backTo)
      } else {
        router.push(backTo)
      }
      return
    }

    // Fallback: go to experiences list
    router.push(homeHref)
  }

  const handleHotelButtonClick = () => {
    // On full experiences page: return to hotel site (via returnUrl)
    const target =
      (returnUrl && isSafeHttpUrl(returnUrl) ? returnUrl : null) ||
      (backTo && isSafeHttpUrl(backTo) ? backTo : null)

    if (target) {
      window.location.assign(target)
      return
    }

    // Fallback: internal navigation to hotel experiences page
    router.push(homeHref)
  }

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="container flex items-center h-14 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            // Detail page: Back button to full experiences list
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 px-2 h-10 -ml-2 rounded-button hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Back to all experiences"
            >
              <svg className="w-5 h-5 text-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7-7 7 7 7" />
              </svg>
              <span className="text-sm font-medium text-foreground">Back</span>
            </button>
          ) : (
            // Full experiences page: Hotel name button to hotel site
            <button
              type="button"
              onClick={handleHotelButtonClick}
              className="inline-flex items-center gap-3 px-2 h-10 -ml-2 rounded-button hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent min-w-0"
              aria-label={`Back to ${hotelName}`}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={hotelName}
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                />
              ) : null}
              <h1 className="text-lg font-heading text-heading-foreground truncate">{hotelName}</h1>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}