'use client'

import { getDisplayPrice } from '@/lib/pricing'
import type { ExperienceWithMedia } from '@/lib/hotels'

interface PriceAnchorProps {
  experience: ExperienceWithMedia
}

export function PriceAnchor({ experience }: PriceAnchorProps) {
  const displayPrice = getDisplayPrice(experience)

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-background-alt rounded-card p-5 font-body">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
          {displayPrice.price}
        </span>
        <span className="text-sm text-muted-foreground">{displayPrice.suffix}</span>
      </div>

      <button
        type="button"
        onClick={scrollToBooking}
        className="w-full mt-4 py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Check availability
      </button>
    </div>
  )
}
