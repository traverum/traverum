'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'
import { DatePickerDrawer } from './DatePickerDrawer'
import { ParticipantSelector } from './ParticipantSelector'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'
import type { AvailabilityRule } from '@/lib/availability'

interface BookingPanelProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  hotelSlug: string
  availabilityRules?: AvailabilityRule[]
  returnUrl?: string | null
}

export function BookingPanel({ experience, sessions, hotelSlug, availabilityRules = [], returnUrl }: BookingPanelProps) {
  const router = useRouter()
  const [participants, setParticipants] = useState(1)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  
  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const priceCalc = calculatePrice(experience, participants, selectedSession)
  const displayPrice = getDisplayPrice(experience)
  
  // Check if session is below minimum-to-run threshold
  const minToRun = experience.min_participants || 1
  const sessionBelowMin = selectedSession && minToRun > 1
    ? (selectedSession.spots_total - selectedSession.spots_available + participants) < minToRun
    : false
  
  const hasDateSelection = isCustomRequest 
    ? (customDate && requestTime)
    : selectedSessionId

  const getDateDisplayText = () => {
    if (!hasDateSelection) return 'Select date'
    if (isCustomRequest && customDate) {
      const date = new Date(customDate)
      // European format: "20.01.2025"
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}.${month}.${year} · ${requestTime || '...'}`
    }
    if (selectedSession) {
      const date = new Date(selectedSession.session_date)
      // European format: "20.01.2025"
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}.${month}.${year} · ${selectedSession.start_time.slice(0, 5)}`
    }
    return 'Select date'
  }

  const handleSessionSelect = (sessionId: string | null, isCustom: boolean) => {
    if (isCustom) {
      setIsCustomRequest(true)
      setSelectedSessionId(null)
    } else {
      setIsCustomRequest(false)
      setSelectedSessionId(sessionId)
    }
  }

  const handleContinue = () => {
    // Validate participants (min_participants is session threshold, not per-booking)
    if (participants < 1 || participants > experience.max_participants) {
      return
    }
    
    // Validate session availability if session-based
    if (selectedSession && selectedSession.spots_available < participants) {
      return
    }
    
    if (hasDateSelection) {
      const params = new URLSearchParams()
      params.set('experienceId', experience.id)
      params.set('participants', participants.toString())
      params.set('total', priceCalc.totalPrice.toString())
      if (returnUrl) params.set('returnUrl', returnUrl)
      
      if (isCustomRequest) {
        params.set('requestDate', customDate)
        params.set('requestTime', requestTime)
        params.set('isRequest', 'true')
      } else if (selectedSession) {
        params.set('sessionId', selectedSession.id)
      }
      
      router.push(`/${hotelSlug}/checkout?${params.toString()}`)
    }
  }

  return (
    <>
      <div className="bg-background-alt rounded-card p-5 font-body">
        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-2xl font-bold text-foreground tabular-nums">{displayPrice.price}</span>
          <span className="text-muted-foreground">{displayPrice.suffix}</span>
        </div>

        {/* Date Selector Button */}
        <button
          type="button"
          onClick={() => setDateDrawerOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-button bg-background hover:border-accent/50 transition-colors duration-150 text-left touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
          aria-label="Select date and time"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect width="18" height="18" x="3" y="4" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" /></svg>
            <span className={hasDateSelection ? 'text-foreground font-medium tabular-nums' : 'text-muted-foreground'}>
              {getDateDisplayText()}
            </span>
          </div>
          <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
        </button>

        {/* Participants Selector */}
        <div className="mt-3">
          <ParticipantSelector
            value={participants}
            onChange={setParticipants}
            min={1}
            max={experience.max_participants}
            availableSpots={selectedSession?.spots_available}
          />
        </div>

        {/* Total & CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-foreground tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
            </div>
          </div>

          {/* Minimum-to-run info */}
          {sessionBelowMin && selectedSession && (
            <p className="text-xs text-muted-foreground mb-3">
              This session needs {minToRun} participants to run ({selectedSession.spots_total - selectedSession.spots_available} booked so far). Your spot will be reserved — no payment until the minimum is reached.
            </p>
          )}
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasDateSelection}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isCustomRequest ? 'Send Request' : sessionBelowMin ? 'Reserve Spot' : 'Book Now'}
          </button>
        </div>
      </div>

      {/* Date Picker Drawer */}
      <DatePickerDrawer
        isOpen={dateDrawerOpen}
        onClose={() => setDateDrawerOpen(false)}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        isCustomRequest={isCustomRequest}
        customDate={customDate}
        requestTime={requestTime}
        onSessionSelect={handleSessionSelect}
        onCustomDateChange={setCustomDate}
        onRequestTimeChange={setRequestTime}
        onConfirm={() => setDateDrawerOpen(false)}
        participants={participants}
        availabilityRules={availabilityRules}
        minParticipants={minToRun}
      />
    </>
  )
}
