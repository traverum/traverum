'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface VeyondHeaderProps {
  showBack?: boolean
  backTo?: string
}

export function VeyondHeader({ showBack = false, backTo }: VeyondHeaderProps) {
  const router = useRouter()

  const handleBackClick = () => {
    if (backTo) {
      router.push(backTo)
      return
    }
    router.push('/experiences')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
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
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 px-2 h-10 -ml-2 rounded-button hover:bg-muted transition-colors"
            >
              <span className="text-lg font-heading" style={{ color: '#5D4631' }}>Veyond</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
