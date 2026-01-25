'use client'

import type { ExperienceWithMedia } from '@/lib/hotels'
import { formatPrice } from '@/lib/utils'
import { calculatePrice } from '@/lib/pricing'

interface MobileBookingBarProps {
  experience: ExperienceWithMedia
  onReserveClick: () => void
  participants: number
  selectedSession: { id: string; price_override_cents: number | null } | null
}

export function MobileBookingBar({ 
  experience, 
  onReserveClick,
  participants,
  selectedSession,
}: MobileBookingBarProps) {
  // Calculate display price
  const priceCalc = calculatePrice(experience, participants, selectedSession)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex items-center justify-between md:hidden z-40 safe-area-bottom font-body">
      <div>
        <span className="font-bold text-foreground">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
      </div>
      <button
        onClick={onReserveClick}
        className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Reserve
      </button>
    </div>
  )
}