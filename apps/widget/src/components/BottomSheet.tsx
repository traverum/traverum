'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { SessionPicker } from './SessionPicker'
import { ParticipantSelector } from './ParticipantSelector'
import { formatPrice } from '@/lib/utils'
import { calculatePrice } from '@/lib/pricing'
import { LanguageSelector } from './LanguageSelector'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'
import type { AvailabilityRule } from '@/lib/availability'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  selectedSessionId: string | null
  isCustomRequest: boolean
  customDate: string
  requestTime: string
  participants: number
  onSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  onCustomDateChange: (date: string) => void
  onRequestTimeChange: (time: string) => void
  onParticipantsChange: (participants: number) => void
  hotelSlug: string
  availabilityRules?: AvailabilityRule[]
  returnUrl?: string | null
}

export function BottomSheet({
  isOpen,
  onClose,
  experience,
  sessions,
  selectedSessionId,
  isCustomRequest,
  customDate,
  requestTime,
  participants,
  onSessionSelect,
  onCustomDateChange,
  onRequestTimeChange,
  onParticipantsChange,
  hotelSlug,
  availabilityRules = [],
  returnUrl,
}: BottomSheetProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const [preferredLanguage, setPreferredLanguage] = useState<string>('')

  const availableLanguages = experience.available_languages || []

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const priceCalc = calculatePrice(experience, participants, selectedSession)
  
  const canContinue = isCustomRequest 
    ? (customDate && requestTime && experience.allows_requests)
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
        params.set('requestTime', requestTime)
        params.set('isRequest', 'true')
        if (preferredLanguage) params.set('preferredLanguage', preferredLanguage)
      } else if (selectedSession) {
        params.set('sessionId', selectedSession.id)
        if (selectedSession.session_language) params.set('preferredLanguage', selectedSession.session_language)
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
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={shouldReduceMotion 
              ? { duration: 0 } 
              : { type: 'spring', damping: 30, stiffness: 300 }
            }
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col safe-area-bottom font-body overscroll-contain"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" aria-hidden="true" />
            </div>

            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <div>
                <h3 id="sheet-title" className="text-lg font-bold text-foreground">Select Date</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Close"
              >
                <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <SessionPicker
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                isCustomRequest={isCustomRequest}
                customDate={customDate}
                requestTime={requestTime}
                onSessionSelect={onSessionSelect}
                onCustomDateChange={onCustomDateChange}
                onRequestTimeChange={onRequestTimeChange}
                participants={participants}
                availabilityRules={availabilityRules}
              />

              {/* Participants */}
              <div className="mt-5 pt-4 border-t border-border">
                <ParticipantSelector
                  value={participants}
                  onChange={onParticipantsChange}
                  min={1}
                  max={experience.max_participants}
                />
              </div>

              {/* Language selector for request flow */}
              {isCustomRequest && availableLanguages.length > 1 && (
                <div className="mt-4">
                  <LanguageSelector
                    value={preferredLanguage}
                    onChange={setPreferredLanguage}
                    languages={availableLanguages}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {formatPrice(priceCalc.totalPrice, experience.currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {isCustomRequest ? 'Send Request' : 'Book Now'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
