'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MobileBookingBar } from './MobileBookingBar'
import { BottomSheet } from './BottomSheet'
import { formatPrice } from '@/lib/utils'
import { calculatePrice } from '@/lib/pricing'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'

interface ExperienceDetailClientProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  hotelSlug: string
}

export function ExperienceDetailClient({ experience, sessions, hotelSlug }: ExperienceDetailClientProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [participants, setParticipants] = useState(experience.min_participants)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const priceCalc = calculatePrice(experience, participants, selectedSession)

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
        participants={participants}
        selectedSession={selectedSession}
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
        customTime={customTime}
        participants={participants}
        onSessionSelect={handleSessionSelect}
        onCustomDateChange={setCustomDate}
        onCustomTimeChange={setCustomTime}
        onParticipantsChange={setParticipants}
        hotelSlug={hotelSlug}
      />
    </>
  )
}