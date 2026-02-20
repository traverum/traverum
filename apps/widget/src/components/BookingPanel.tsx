'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'
import { DatePickerDrawer } from './DatePickerDrawer'
import { ParticipantSelector } from './ParticipantSelector'
import { LanguageSelector } from './LanguageSelector'
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
  const isRental = experience.pricing_type === 'per_day'

  // Session-based booking state
  const [participants, setParticipants] = useState(experience.min_participants || 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false)
  const [preferredLanguage, setPreferredLanguage] = useState<string>('')

  // Rental-specific state (per_day pricing)
  const [rentalDate, setRentalDate] = useState('')
  const [rentalDays, setRentalDays] = useState(experience.min_days || 1)
  const [quantity, setQuantity] = useState(1)

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const availableLanguages = experience.available_languages || []
  const minDays = experience.min_days || 1
  const maxDays = experience.max_days || null

  const priceCalc = isRental
    ? calculatePrice(experience, quantity, null, rentalDays, quantity)
    : calculatePrice(experience, participants, selectedSession)
  const displayPrice = getDisplayPrice(experience)
  
  const hasDateSelection = isRental
    ? !!rentalDate
    : (isCustomRequest ? (customDate && requestTime) : selectedSessionId)

  const getDateDisplayText = () => {
    if (isRental) {
      if (!rentalDate) return 'Select date'
      const d = new Date(rentalDate + 'T12:00:00')
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      return `${day}.${month}.${year} · ${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}`
    }
    if (!hasDateSelection) return 'Select date'
    if (isCustomRequest && customDate) {
      const [year, month, day] = customDate.split('-')
      return `${day}.${month}.${year} · ${requestTime || '...'}`
    }
    if (selectedSession) {
      const [year, month, day] = selectedSession.session_date.split('-')
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
    const params = new URLSearchParams()
    params.set('experienceId', experience.id)
    if (returnUrl) params.set('returnUrl', returnUrl)

    if (isRental) {
      params.set('participants', quantity.toString())
      params.set('total', priceCalc.totalPrice.toString())
      params.set('requestDate', rentalDate)
      params.set('rentalDays', rentalDays.toString())
      params.set('quantity', quantity.toString())
      params.set('isRequest', 'true')
    } else {
      if (participants < 1 || participants > experience.max_participants) return
      params.set('participants', participants.toString())
      params.set('total', priceCalc.totalPrice.toString())
      
      if (isCustomRequest) {
        params.set('requestDate', customDate)
        params.set('requestTime', requestTime)
        params.set('isRequest', 'true')
        if (preferredLanguage) params.set('preferredLanguage', preferredLanguage)
      } else if (selectedSession) {
        params.set('sessionId', selectedSession.id)
        if (selectedSession.session_language) params.set('preferredLanguage', selectedSession.session_language)
      }
    }
    
    router.push(`/${hotelSlug}/checkout?${params.toString()}`)
  }

  // --- Unified UI for both rental and session-based ---
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
          aria-label={isRental ? 'Select rental date' : 'Select date and time'}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect width="18" height="18" x="3" y="4" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" /></svg>
            <span className={hasDateSelection ? 'text-foreground font-medium tabular-nums' : 'text-muted-foreground'}>
              {getDateDisplayText()}
            </span>
          </div>
          <svg className="w-5 h-5 text-muted-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
        </button>

        {/* Participants / Quantity Selector */}
        <div className="mt-3">
          {isRental ? (
            <ParticipantSelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={experience.max_participants}
              label="Quantity"
            />
          ) : (
            <ParticipantSelector
              value={participants}
              onChange={setParticipants}
              min={experience.min_participants || 1}
              max={experience.max_participants}
            />
          )}
        </div>

        {/* Language selector for request flow (non-rental only) */}
        {!isRental && isCustomRequest && availableLanguages.length > 1 && (
          <div className="mt-3">
            <LanguageSelector
              value={preferredLanguage}
              onChange={setPreferredLanguage}
              languages={availableLanguages}
            />
          </div>
        )}

        {/* Total & CTA */}
        <div className="mt-4 pt-4 border-t border-border">
          {/* Rental price breakdown */}
          {isRental && rentalDate && (
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{displayPrice.price} × {rentalDays} {rentalDays === 1 ? 'day' : 'days'}{quantity > 1 ? ` × ${quantity}` : ''}</span>
                <span className="tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground">Total</span>
            <div className="text-right">
              <span className="text-xl font-bold text-foreground tabular-nums">
                {isRental && !rentalDate
                  ? '—'
                  : formatPrice(priceCalc.totalPrice, experience.currency)
                }
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!hasDateSelection}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isRental || isCustomRequest ? 'Send Request' : 'Book Now'}
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
        customDate={isRental ? rentalDate : customDate}
        requestTime={requestTime}
        onSessionSelect={handleSessionSelect}
        onCustomDateChange={isRental ? setRentalDate : setCustomDate}
        onRequestTimeChange={setRequestTime}
        onConfirm={() => setDateDrawerOpen(false)}
        participants={isRental ? quantity : participants}
        availabilityRules={availabilityRules}
        mode={isRental ? 'rental' : 'session'}
        rentalDays={rentalDays}
        onRentalDaysChange={setRentalDays}
        minDays={minDays}
        maxDays={maxDays}
      />
    </>
  )
}
