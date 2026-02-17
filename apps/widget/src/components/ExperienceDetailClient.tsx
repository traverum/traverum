'use client'

import { useState } from 'react'
import { MobileBookingBar } from './MobileBookingBar'
import { BottomSheet } from './BottomSheet'
import { calculatePrice } from '@/lib/pricing'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'
import type { AvailabilityRule } from '@/lib/availability'

interface ExperienceDetailClientProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  hotelSlug: string
  availabilityRules?: AvailabilityRule[]
  returnUrl?: string | null
}

export function ExperienceDetailClient({ experience, sessions, hotelSlug, availabilityRules = [], returnUrl }: ExperienceDetailClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [participants, setParticipants] = useState(experience.min_participants || 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [requestTime, setRequestTime] = useState('')

  // Rental-specific state (per_day pricing)
  const [rentalDate, setRentalDate] = useState('')
  const [rentalDays, setRentalDays] = useState(experience.min_days || 1)
  const [quantity, setQuantity] = useState(1)

  const isRental = experience.pricing_type === 'per_day'
  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null

  const priceCalc = isRental
    ? calculatePrice(experience, quantity, null, rentalDays, quantity)
    : calculatePrice(experience, participants, selectedSession)

  const handleSessionSelect = (sessionId: string | null, isCustom: boolean) => {
    if (isCustom) {
      setIsCustomRequest(true)
      setSelectedSessionId(null)
    } else {
      setIsCustomRequest(false)
      setSelectedSessionId(sessionId)
    }
  }

  return (
    <>
      {/* Mobile Booking Bar */}
      <MobileBookingBar
        experience={experience}
        onReserveClick={() => setSheetOpen(true)}
        participants={isRental ? quantity : participants}
        selectedSession={isRental ? null : selectedSession}
        rentalDays={isRental ? rentalDays : undefined}
        quantity={isRental ? quantity : undefined}
      />
      
      {/* Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        experience={experience}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        isCustomRequest={isCustomRequest}
        customDate={customDate}
        requestTime={requestTime}
        participants={participants}
        onSessionSelect={handleSessionSelect}
        onCustomDateChange={setCustomDate}
        onRequestTimeChange={setRequestTime}
        onParticipantsChange={setParticipants}
        hotelSlug={hotelSlug}
        availabilityRules={availabilityRules}
        returnUrl={returnUrl}
        rentalDate={rentalDate}
        rentalDays={rentalDays}
        quantity={quantity}
        onRentalDateChange={setRentalDate}
        onRentalDaysChange={setRentalDays}
        onQuantityChange={setQuantity}
      />
    </>
  )
}
