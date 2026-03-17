'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ContentLanguageSelector } from '@/components/ContentLanguageSelector'

/**
 * Header for /experiences routes. Matches receptionist design (receptionist-ui).
 * On /experiences shows Veyond + language. On subpages shows Back + language.
 */
export function ExperiencesLayoutHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const isListing = pathname === '/experiences'

  const handleBack = () => {
    router.push('/experiences')
  }

  return (
    <header className="bg-background">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {isListing ? (
              <Link
                href="/experiences"
                className="text-lg font-light text-foreground tracking-wide"
              >
                Veyond
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label="Back to all experiences"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            )}
          </div>
          <div className="flex-shrink-0">
            <ContentLanguageSelector />
          </div>
        </div>
      </div>
    </header>
  )
}
