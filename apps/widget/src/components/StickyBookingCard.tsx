'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { cn, formatPrice } from '@/lib/utils'
import { isDateAvailable } from '@/lib/availability'
import { buildTrustPoints } from '@/lib/experience-detail-copy'
import { useBookingFlow } from './BookingFlowContext'
import type { PriceCalculation } from '@/lib/pricing'
import type { ExperienceWithMedia } from '@/lib/hotels'

const DualCalendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.DualCalendar })),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse bg-muted/30 rounded-lg" /> }
)

const DualRangeCalendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.DualRangeCalendar })),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse bg-muted/30 rounded-lg" /> }
)

export function StickyBookingCard() {
  const {
    experience,
    sessions,
    selectedDate,
    setSelectedDate,
    participants,
    setParticipants,
    quantity,
    setQuantity,
    rentalEndDate,
    setRentalEndDate,
    rentalDays,
    isRental,
    displayPrice,
    priceCalc,
    canContinue,
    handleContinue,
    availabilityRules,
    sessionsByDate,
    sessionsForDate,
    selectedSessionId,
    isCustomRequest,
    resultsRef,
  } = useBookingFlow()

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [travelersOpen, setTravelersOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const paymentMode = experience.supplier.payment_mode
  const hasAnySessions = sessions.length > 0
  const allowsRequests = experience.allows_requests ?? false

  const trustPoints = useMemo(
    () =>
      buildTrustPoints({
        paymentMode,
        hasSessions: hasAnySessions,
        allowsRequests,
        isRental,
      }),
    [paymentMode, hasAnySessions, allowsRequests, isRental]
  )

  const minParticipants = experience.min_participants || 1
  const maxParticipants = experience.max_participants
  const minDays = experience.min_days || 1
  const maxDays = experience.max_days || 30

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const dateHasSessions = useCallback((date: Date): boolean => {
    const key = format(date, 'yyyy-MM-dd')
    return !!sessionsByDate[key]?.length
  }, [sessionsByDate])

  const isDateDisabled = useCallback((date: Date): boolean => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    if (d < today) return true
    if (availabilityRules.length > 0 && !isDateAvailable(d, availabilityRules) && !dateHasSessions(d)) return true
    return false
  }, [availabilityRules, today, dateHasSessions])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(format(date, 'yyyy-MM-dd'))
    } else {
      setSelectedDate('')
    }
    setCalendarOpen(false)
  }

  const handleRangeChange = useCallback((start: Date | undefined, end: Date | undefined) => {
    setSelectedDate(start ? format(start, 'yyyy-MM-dd') : '')
    setRentalEndDate(end ? format(end, 'yyyy-MM-dd') : '')
    if (start && end) setCalendarOpen(false)
  }, [setSelectedDate, setRentalEndDate])

  const selectedDateObj = useMemo(
    () => selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined,
    [selectedDate]
  )

  const rentalEndDateObj = useMemo(
    () => rentalEndDate ? new Date(rentalEndDate + 'T00:00:00') : undefined,
    [rentalEndDate]
  )

  const dateLabel = useMemo(() => {
    if (isRental) {
      if (selectedDate && rentalEndDate) {
        const s = format(new Date(selectedDate + 'T00:00:00'), 'MMM d')
        const e = format(new Date(rentalEndDate + 'T00:00:00'), 'MMM d')
        return `${s} – ${e}`
      }
      if (selectedDate) {
        return format(new Date(selectedDate + 'T00:00:00'), 'MMM d') + ' – …'
      }
      return 'Select dates'
    }
    return selectedDate
      ? format(new Date(selectedDate + 'T00:00:00'), 'EEE, MMM d')
      : 'Select date'
  }, [isRental, selectedDate, rentalEndDate])

  const travelersLabel = isRental
    ? `${quantity}`
    : `${participants} ${participants === 1 ? 'person' : 'people'}`

  const participantOptions = useMemo(() => {
    const opts: number[] = []
    for (let i = minParticipants; i <= maxParticipants; i++) opts.push(i)
    return opts
  }, [minParticipants, maxParticipants])

  const toggleCalendar = () => {
    setCalendarOpen(prev => !prev)
    setTravelersOpen(false)
  }

  const toggleTravelers = () => {
    setTravelersOpen(prev => !prev)
    setCalendarOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
        setTravelersOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="bg-background-alt rounded-card p-5 font-body space-y-4">
      {/* Price — live total based on current selection */}
      <div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-semibold text-foreground tabular-nums tracking-tight">
            {formatPrice(priceCalc.totalPrice, experience.currency)}
          </span>
          {experience.pricing_type === 'flat_rate' && (
            <span className="text-sm text-muted-foreground">total</span>
          )}
        </div>
        <PriceBreakdown experience={experience} priceCalc={priceCalc} participants={participants} />
      </div>

      {/* Date + Travelers combined row */}
      <div ref={wrapperRef} className="relative">
        <div
          className={cn(
            'flex rounded-button border bg-background transition-colors duration-150',
            (calendarOpen || travelersOpen) ? 'border-accent' : 'border-border'
          )}
        >
          {/* Date button */}
          <button
            type="button"
            onClick={toggleCalendar}
            className="flex-1 flex items-center justify-between px-3 py-2 text-left border-r border-border touch-manipulation focus:outline-none"
          >
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                {isRental ? 'Dates' : 'Date'}
              </div>
              <span className={cn('text-sm block truncate', selectedDate ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {dateLabel}
              </span>
            </div>
            <svg className={cn('w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-1 transition-transform duration-150', calendarOpen && 'rotate-180')} aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
          </button>

          {/* Travelers / Quantity button */}
          <button
            type="button"
            onClick={toggleTravelers}
            className="flex items-center justify-between px-3 py-2 text-left touch-manipulation focus:outline-none min-w-[110px]"
          >
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                {isRental ? 'Qty' : 'Travelers'}
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                <span className="text-sm text-foreground font-medium tabular-nums">{travelersLabel}</span>
              </div>
            </div>
            <svg className={cn('w-3.5 h-3.5 text-muted-foreground flex-shrink-0 ml-1 transition-transform duration-150', travelersOpen && 'rotate-180')} aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        {/* Calendar popup — two months, extends left over content column */}
        {calendarOpen && (
          <div className="absolute z-50 right-0 mt-1 bg-background border border-border rounded-card shadow-lg p-1">
            {isRental ? (
              <DualRangeCalendar
                rangeStart={selectedDateObj}
                rangeEnd={rentalEndDateObj}
                onRangeChange={handleRangeChange}
                disabled={isDateDisabled}
                minDays={minDays}
                maxDays={maxDays}
              />
            ) : (
              <DualCalendar
                selected={selectedDateObj}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                datesWithSessions={Object.keys(sessionsByDate)}
              />
            )}
          </div>
        )}

        {/* Travelers dropdown */}
        {travelersOpen && (
          <div className="absolute z-50 right-0 mt-1 w-full bg-background border border-border rounded-card shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto overscroll-contain">
              {(isRental ? Array.from({ length: maxParticipants }, (_, i) => i + 1) : participantOptions).map(n => {
                const isSelected = isRental ? quantity === n : participants === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      if (isRental) setQuantity(n)
                      else setParticipants(n)
                      setTravelersOpen(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm transition-colors duration-100 touch-manipulation focus:outline-none',
                      isSelected ? 'bg-accent/10 text-accent font-medium' : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className="tabular-nums">
                      {isRental ? n : `${n} ${n === 1 ? 'person' : 'people'}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rental CTA — price summary + send request */}
      {isRental && selectedDate && rentalEndDate && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {displayPrice.price} x {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
              {quantity > 1 ? ` x ${quantity}` : ''}
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {formatPrice(priceCalc.totalPrice, experience.currency)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Send Request
          </button>
        </div>
      )}

      {/* Non-rental CTA — always visible. Drives the funnel from any state. */}
      {!isRental && (
        <PrimaryCta
          selectedDate={selectedDate}
          canContinue={canContinue}
          isCustomRequest={isCustomRequest}
          hasSessionSelected={!!selectedSessionId}
          hasSessionsForDate={sessionsForDate.length > 0}
          paymentMode={paymentMode}
          onOpenCalendar={() => {
            setCalendarOpen(true)
            setTravelersOpen(false)
          }}
          onScrollToResults={() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          onContinue={handleContinue}
        />
      )}

      {/* Trust microcopy — concise reassurance points near the CTA */}
      <ul className="space-y-1 pt-1">
        {trustPoints.map(point => (
          <li key={point} className="flex items-start gap-2 text-[12px] text-muted-foreground leading-snug">
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5 flex-shrink-0 mt-[2px] text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PrimaryCta({
  selectedDate,
  canContinue,
  isCustomRequest,
  hasSessionSelected,
  hasSessionsForDate,
  paymentMode,
  onOpenCalendar,
  onScrollToResults,
  onContinue,
}: {
  selectedDate: string
  canContinue: boolean
  isCustomRequest: boolean
  hasSessionSelected: boolean
  hasSessionsForDate: boolean
  paymentMode: 'stripe' | 'pay_on_site'
  onOpenCalendar: () => void
  onScrollToResults: () => void
  onContinue: () => void
}) {
  let label: string
  let onClick: () => void

  if (!selectedDate) {
    label = 'Check availability'
    onClick = onOpenCalendar
  } else if (!canContinue) {
    label = hasSessionsForDate ? 'Choose a time' : 'Pick a time'
    onClick = onScrollToResults
  } else if (isCustomRequest) {
    label = 'Send Request'
    onClick = onContinue
  } else if (hasSessionSelected) {
    label = paymentMode === 'pay_on_site' ? 'Reserve Now' : 'Book Now'
    onClick = onContinue
  } else {
    label = 'Continue'
    onClick = onContinue
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {label}
    </button>
  )
}

function PriceBreakdown({
  experience,
  priceCalc,
  participants,
}: {
  experience: ExperienceWithMedia
  priceCalc: PriceCalculation
  participants: number
}) {
  const currency = experience.currency || 'EUR'

  switch (experience.pricing_type) {
    case 'per_person': {
      const unitPrice = priceCalc.pricePerPerson ?? 0
      return (
        <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
          {formatPrice(unitPrice, currency)} × {participants} {participants === 1 ? 'person' : 'people'}
        </p>
      )
    }

    case 'base_plus_extra': {
      const included = experience.included_participants || 1
      if (priceCalc.extraParticipants > 0) {
        return (
          <p className="text-[13px] text-muted-foreground mt-0.5 tabular-nums">
            {formatPrice(priceCalc.basePrice, currency)} for {included} + {formatPrice(experience.extra_person_cents || 0, currency)} × {priceCalc.extraParticipants} extra
          </p>
        )
      }
      return (
        <p className="text-[13px] text-muted-foreground mt-0.5">
          for up to {included} {included === 1 ? 'person' : 'people'}
        </p>
      )
    }

    case 'flat_rate':
      return (
        <p className="text-[13px] text-muted-foreground mt-0.5">
          fixed price for the group
        </p>
      )

    case 'per_day':
      return null

    default:
      return null
  }
}
