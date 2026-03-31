'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { calculatePrice, getDisplayPrice } from '@/lib/pricing'
import { SessionPicker } from './SessionPicker'
import { ParticipantSelector } from './ParticipantSelector'
import { LanguageSelector } from './LanguageSelector'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { ExperienceSession } from '@/lib/supabase/types'
import type { AvailabilityRule } from '@/lib/availability'

interface BookingSectionProps {
  experience: ExperienceWithMedia
  sessions: ExperienceSession[]
  hotelSlug: string
  availabilityRules?: AvailabilityRule[]
  returnUrl?: string | null
  bookingIntro: string
  cancellationSummary: string
}

export function BookingSection({
  experience,
  sessions,
  hotelSlug,
  availabilityRules = [],
  returnUrl,
  bookingIntro,
  cancellationSummary,
}: BookingSectionProps) {
  const router = useRouter()
  const isRental = experience.pricing_type === 'per_day'

  const [participants, setParticipants] = useState(experience.min_participants || 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [isCustomRequest, setIsCustomRequest] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState<string>('')

  const [rentalDate, setRentalDate] = useState('')
  const [rentalEndDate, setRentalEndDate] = useState('')
  const [quantity, setQuantity] = useState(1)

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null
  const availableLanguages = experience.available_languages || []
  const minDays = experience.min_days || 1
  const maxDays = experience.max_days || null

  const rentalDays = useMemo(() => {
    if (!isRental || !rentalDate || !rentalEndDate) return experience.min_days || 1
    const s = new Date(rentalDate + 'T12:00:00')
    const e = new Date(rentalEndDate + 'T12:00:00')
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1)
  }, [isRental, rentalDate, rentalEndDate, experience.min_days])

  const priceCalc = isRental
    ? calculatePrice(experience, quantity, null, rentalDays, quantity)
    : calculatePrice(experience, participants, selectedSession)
  const displayPrice = getDisplayPrice(experience)

  const canContinue = isRental
    ? !!(rentalDate && rentalEndDate)
    : (isCustomRequest
      ? (customDate && requestTime && experience.allows_requests)
      : !!selectedSessionId)

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
    if (!canContinue) return

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

  return (
    <section
      id="booking"
      className="hidden md:block mt-10 pt-10 border-t border-border font-body scroll-mt-24"
      aria-labelledby="booking-section-heading"
    >
      <div className="mb-8">
        <h2
          id="booking-section-heading"
          className="font-heading text-heading-foreground"
          style={{ fontSize: 'var(--font-size-h2)' }}
        >
          Book this experience
        </h2>
        <p className="text-muted-foreground mt-1.5 max-w-2xl" style={{ fontSize: 'var(--font-size-sm)' }}>
          {bookingIntro}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 min-w-0">
          <SessionPicker
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            isCustomRequest={isCustomRequest}
            customDate={isRental ? rentalDate : customDate}
            requestTime={requestTime}
            onSessionSelect={handleSessionSelect}
            onCustomDateChange={isRental ? setRentalDate : setCustomDate}
            onRequestTimeChange={setRequestTime}
            participants={isRental ? quantity : participants}
            availabilityRules={availabilityRules}
            mode={isRental ? 'rental' : 'session'}
            rentalEndDate={rentalEndDate}
            onRentalEndDateChange={setRentalEndDate}
            minDays={minDays}
            maxDays={maxDays}
          />
        </div>

        <div className="lg:col-span-2 bg-background-alt rounded-card p-5 space-y-5">
          <div>
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

          {!isRental && isCustomRequest && availableLanguages.length > 1 && (
            <LanguageSelector
              value={preferredLanguage}
              onChange={setPreferredLanguage}
              languages={availableLanguages}
            />
          )}

          <div className="pt-4 border-t border-border">
            {experience.pricing_type === 'per_person' && participants > 1 && !isRental && (
              <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
                <span>{formatPrice(priceCalc.pricePerPerson ?? 0, experience.currency)} x {participants} people</span>
                <span className="tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
              </div>
            )}

            {isRental && rentalDate && (
              <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
                <span>{displayPrice.price} x {rentalDays} {rentalDays === 1 ? 'day' : 'days'}{quantity > 1 ? ` x ${quantity}` : ''}</span>
                <span className="tabular-nums">{formatPrice(priceCalc.totalPrice, experience.currency)}</span>
              </div>
            )}

            {experience.pricing_type === 'base_plus_extra' && !isRental && priceCalc.extraParticipants > 0 && (
              <div className="space-y-1 mb-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Base · {priceCalc.includedParticipants} {priceCalc.includedParticipants === 1 ? 'person' : 'people'}</span>
                  <span className="tabular-nums">{formatPrice(priceCalc.basePrice, experience.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceCalc.extraParticipants} extra x {formatPrice(experience.extra_person_cents ?? 0, experience.currency ?? 'EUR')}</span>
                  <span className="tabular-nums">{formatPrice(priceCalc.extraPersonFee, experience.currency)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-foreground font-medium">Total</span>
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {isRental && !rentalDate
                  ? '\u2014'
                  : formatPrice(priceCalc.totalPrice, experience.currency)
                }
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {isRental || isCustomRequest ? 'Send Request' : 'Book Now'}
          </button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {cancellationSummary}
          </p>
        </div>
      </div>
    </section>
  )
}
