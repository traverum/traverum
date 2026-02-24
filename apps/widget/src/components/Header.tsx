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
  websiteUrl?: string | null
}

export function Header({ hotelName, logoUrl, hotelSlug, showBack = false, backTo, returnUrl, websiteUrl }: HeaderProps) {
  const router = useRouter()

  const homeHref = returnUrl
    ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
    : `/${hotelSlug}`

  const isSafeHttpUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleBackClick = () => {
    if (backTo) {
      if (isSafeHttpUrl(backTo)) {
        window.location.assign(backTo)
      } else {
        router.push(backTo)
      }
      return
    }
    router.push(homeHref)
  }

  const handleHotelButtonClick = () => {
    // Priority: returnUrl > websiteUrl > do nothing
    const target =
      (returnUrl && isSafeHttpUrl(returnUrl) ? returnUrl : null) ||
      (websiteUrl && isSafeHttpUrl(websiteUrl) ? websiteUrl : null)

    if (target) {
      window.location.assign(target)
      return
    }
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
                  width={140}
                  height={40}
                  className="h-8 w-auto object-contain"
                  unoptimized={logoUrl.endsWith('.svg') || logoUrl.includes('.svg?')}
                />
              ) : (
                <h1 className="text-lg font-heading text-heading-foreground truncate">{hotelName}</h1>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}