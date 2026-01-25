'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { SessionPicker } from './SessionPicker'
import { ParticipantSelector } from './ParticipantSelector'
import { formatPrice } from '@/lib/utils'
import { calculatePrice } from '@/lib/pricing'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  selectedSessionId: string | null
  isCustomRequest: boolean
  customDate: string
  customTime: string
  participants: number
  onSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  onCustomDateChange: (date: string) => void
  onCustomTimeChange: (time: string) => void
  onParticipantsChange: (participants: number) => void
  hotelSlug: string
}

export function BottomSheet({
  isOpen,
  onClose,
  experience,
  sessions,
  selectedSessionId,
  isCustomRequest,
  customDate,
  customTime,
  participants,
  onSessionSelect,
  onCustomDateChange,
  onCustomTimeChange,
  onParticipantsChange,
  hotelSlug,
}: BottomSheetProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const priceCalc = calculatePrice(experience, participants, selectedSession)

  const canContinue = isCustomRequest 
    ? (customDate && customTime && experience.allows_requests)
    : selectedSessionId

  const handleContinue = () => {
    if (canContinue) {
      const params = new URLSearchParams()
      params.set('experienceId', experience.id)
      params.set('participants', participants.toString())
      params.set('total', priceCalc.totalPrice.toString())
      if (returnUrl) params.set('returnUrl', returnUrl)
      
      if (isCustomRequest) {
        params.set('requestDate', customDate)
        params.set('requestTime', customTime)
        params.set('isRequest', 'true')
      } else if (selectedSession) {
        params.set('sessionId', selectedSession.id)
      }
      
      onClose()
      router.push(`/${hotelSlug}/checkout?${params.toString()}`)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom font-body"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-medium text-foreground">Select Date & Time</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SessionPicker
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                isCustomRequest={isCustomRequest}
                customDate={customDate}
                customTime={customTime}
                onSessionSelect={onSessionSelect}
                onCustomDateChange={onCustomDateChange}
                onCustomTimeChange={onCustomTimeChange}
                participants={participants}
              />

              {/* Participants */}
              <div className="mt-5 pt-4 border-t border-border">
                <ParticipantSelector
                  value={participants}
                  onChange={onParticipantsChange}
                  min={experience.min_participants}
                  max={experience.max_participants}
                  availableSpots={selectedSession?.spots_available}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(priceCalc.totalPrice, experience.currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {isCustomRequest ? 'Send Request' : 'Reserve'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
