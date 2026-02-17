'use client'

import type { ExperienceWithMedia } from '@/lib/hotels'
import { formatPrice } from '@/lib/utils'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'

interface MobileBookingBarProps {
  experience: ExperienceWithMedia
  onReserveClick: () => void
  participants: number
  selectedSession: { id: string; price_override_cents: number | null } | null
  rentalDays?: number
  quantity?: number
}

export function MobileBookingBar({ 
  experience, 
  onReserveClick,
  participants,
  selectedSession,
  rentalDays,
  quantity,
}: MobileBookingBarProps) {
  const isRental = experience.pricing_type === 'per_day'

  // For rental: show per-day price if no dates selected, otherwise show total
  if (isRental) {
    const displayPrice = getDisplayPrice(experience)
    const hasRentalDates = rentalDays && rentalDays > 0
    const priceCalc = hasRentalDates
      ? calculatePrice(experience, quantity || 1, null, rentalDays, quantity || 1)
      : null

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex items-center justify-between md:hidden z-40 safe-area-bottom font-body">
        <div>
          {hasRentalDates && priceCalc ? (
            <span className="font-bold text-foreground tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
          ) : (
            <span className="font-bold text-foreground tabular-nums">{displayPrice.price}€ <span className="text-sm font-normal text-muted-foreground">{displayPrice.suffix}</span></span>
          )}
        </div>
        <button
          type="button"
          onClick={onReserveClick}
          className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Reserve
        </button>
      </div>
    )
  }

  // Session-based pricing
  const priceCalc = calculatePrice(experience, participants, selectedSession)

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 flex items-center justify-between md:hidden z-40 safe-area-bottom font-body">
      <div>
        <span className="font-bold text-foreground tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
      </div>
      <button
        type="button"
        onClick={onReserveClick}
        className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Reserve
      </button>
    </div>
  )
}
