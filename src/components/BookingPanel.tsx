'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ChevronDown } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'
import { DatePickerDrawer } from './DatePickerDrawer'
import { ParticipantSelector } from './ParticipantSelector'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'

interface BookingPanelProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  hotelSlug: string
}

export function BookingPanel({ experience, sessions, hotelSlug }: BookingPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const [participants, setParticipants] = useState(experience.min_participants)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  
  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const priceCalc = calculatePrice(experience, participants, selectedSession)
  const displayPrice = getDisplayPrice(experience)
  const isMinEnforced = priceCalc.effectiveParticipants > participants
  
  const hasDateSelection = isCustomRequest 
    ? (customDate && customTime)
    : selectedSessionId

  const getDateDisplayText = () => {
    if (!hasDateSelection) return 'Select date'
    if (isCustomRequest && customDate && customTime) {
      const date = new Date(customDate)
      // European format: "20.01.2025"
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}.${month}.${year} · ${customTime}`
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
    // Validate participants
    if (participants < experience.min_participants || participants > experience.max_participants) {
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
        params.set('requestTime', customTime)
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
          <span className="text-2xl font-bold text-foreground">{displayPrice.price}</span>
          <span className="text-muted-foreground">{displayPrice.suffix}</span>
        </div>

        {/* Date Selector Button */}
        <button
          type="button"
          onClick={() => setDateDrawerOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-button bg-background hover:border-accent/50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className={hasDateSelection ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {getDateDisplayText()}
            </span>
          </div>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Participants Selector */}
        <div className="mt-3">
          <ParticipantSelector
            value={participants}
            onChange={setParticipants}
            min={experience.min_participants}
            max={experience.max_participants}
            availableSpots={selectedSession?.spots_available}
          />
          {isMinEnforced && (
            <p className="text-xs text-muted-foreground mt-2">
              Minimum {experience.min_participants} {experience.min_participants === 1 ? 'person' : 'people'} required
            </p>
          )}
        </div>

        {/* Total & CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-foreground">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
              {isMinEnforced && priceCalc.effectiveParticipants > participants && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ({participants} × {formatPrice(priceCalc.pricePerPerson || 0, experience.currency)} = {formatPrice(priceCalc.totalPrice, experience.currency)})
                </p>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasDateSelection}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isCustomRequest ? 'Send Request' : 'Reserve'}
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
        customTime={customTime}
        onSessionSelect={handleSessionSelect}
        onCustomDateChange={setCustomDate}
        onCustomTimeChange={setCustomTime}
        onConfirm={() => setDateDrawerOpen(false)}
        participants={participants}
      />
    </>
  )
}
