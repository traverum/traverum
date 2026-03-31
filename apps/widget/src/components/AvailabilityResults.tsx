'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { formatTime, formatPrice, cn } from '@/lib/utils'
import { getLanguageName } from '@/lib/languages'
import { buildCtaNote } from '@/lib/experience-detail-copy'
import { LanguageSelector } from './LanguageSelector'
import { useBookingFlow } from './BookingFlowContext'

export function AvailabilityResults() {
  const {
    experience,
    isSearchActive,
    selectedDate,
    sessionsForDate,
    requestTimeSlots,
    selectedSessionId,
    isCustomRequest,
    requestTime,
    handleSessionSelect,
    handleRequestTimeChange,
    preferredLanguage,
    setPreferredLanguage,
    isRental,
    canContinue,
    handleContinue,
    resultsRef,
  } = useBookingFlow()

  const shouldReduceMotion = useReducedMotion()
  const [showRequestTimes, setShowRequestTimes] = useState(false)
  const availableLanguages = experience.available_languages || []

  if (!isSearchActive || !selectedDate) return null
  if (isRental) return null

  const hasSessions = sessionsForDate.length > 0
  const hasRequestSlots = requestTimeSlots.length > 0
  const paymentMode = experience.supplier.payment_mode
  const isPayOnSite = paymentMode === 'pay_on_site'

  const handleSelectSession = (sessionId: string) => {
    handleSessionSelect(sessionId, false)
    setShowRequestTimes(false)
  }

  const handleSelectRequestTime = (time: string) => {
    handleRequestTimeChange(time)
  }

  const handleToggleRequestTimes = () => {
    if (!showRequestTimes) {
      handleSessionSelect(null, true)
      handleRequestTimeChange('')
    } else {
      handleSessionSelect(null, false)
      handleRequestTimeChange('')
    }
    setShowRequestTimes(prev => !prev)
  }

  return (
    <section
      ref={resultsRef}
      id="availability-results"
      className="hidden md:block mt-10 pt-8 border-t border-border font-body scroll-mt-24"
      aria-labelledby="availability-heading"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        >
          <h2
            id="availability-heading"
            className="font-body text-heading-foreground"
            style={{ fontSize: 'var(--font-size-h3)' }}
          >
            {hasSessions ? 'Available options' : 'Request a time'}
          </h2>

          {/* Session mode — sessions exist for this date */}
          {!isRental && hasSessions && (
            <div className="mt-3 space-y-3">
              {sessionsForDate.map(session => {
                const isSelected = selectedSessionId === session.id && !isCustomRequest
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSelectSession(session.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-card border text-left transition-colors duration-150 touch-manipulation',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                        : 'border-border hover:border-accent/40 bg-background-alt'
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-4">
                      {/* Radio indicator */}
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150',
                        isSelected ? 'border-accent' : 'border-border'
                      )}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {formatTime(session.start_time)}
                          </span>
                          {session.session_language && (
                            <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {getLanguageName(session.session_language)}
                            </span>
                          )}
                        </div>
                        {session.spots_available !== null && session.spots_total !== null && (
                          <span className="text-xs text-muted-foreground">
                            {session.spots_available} {session.spots_available === 1 ? 'spot' : 'spots'} left
                          </span>
                        )}
                      </div>
                    </div>

                    {session.price_override_cents && (
                      <span className="text-sm font-medium text-foreground tabular-nums">
                        {formatPrice(session.price_override_cents, experience.currency)}
                        {experience.pricing_type === 'per_person' && (
                          <span className="text-xs text-muted-foreground font-normal"> / person</span>
                        )}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* CTA — always visible so the guest knows the next step */}
              {!showRequestTimes && (
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!selectedSessionId || isCustomRequest}
                    className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {isPayOnSite ? 'Reserve Now' : 'Book Now'}
                  </button>
                  {(() => {
                    const note = buildCtaNote({ paymentMode, isRequest: false })
                    if (!note) return null
                    return <p className="text-[13px] text-muted-foreground text-center">{note}</p>
                  })()}
                </div>
              )}

              {/* Request a different time */}
              {hasRequestSlots && experience.allows_requests && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleToggleRequestTimes}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                    <span>{showRequestTimes ? 'Back to available sessions' : 'Request a different time'}</span>
                  </button>

                  <AnimatePresence>
                    {showRequestTimes && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                        className="overflow-hidden pt-4"
                      >
                        <RequestTimeSlotsGrid
                          slots={requestTimeSlots}
                          selectedTime={requestTime}
                          isCustomRequest={isCustomRequest}
                          onSelect={handleSelectRequestTime}
                          showLanguageSelector={availableLanguages.length > 1}
                          preferredLanguage={preferredLanguage}
                          onLanguageChange={setPreferredLanguage}
                          languages={availableLanguages}
                          canContinue={canContinue}
                          onContinue={handleContinue}
                          paymentMode={paymentMode}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Session mode — no sessions, request only */}
          {!isRental && !hasSessions && (
            <div className="mt-3 space-y-4">
              {hasRequestSlots && experience.allows_requests ? (
                <RequestTimeSlotsGrid
                  slots={requestTimeSlots}
                  selectedTime={requestTime}
                  isCustomRequest={isCustomRequest}
                  onSelect={handleSelectRequestTime}
                  showLanguageSelector={availableLanguages.length > 1}
                  preferredLanguage={preferredLanguage}
                  onLanguageChange={setPreferredLanguage}
                  languages={availableLanguages}
                  canContinue={canContinue}
                  onContinue={handleContinue}
                  paymentMode={paymentMode}
                  noteBelowSlots={
                    <p className="text-[13px] text-muted-foreground">
                      {isPayOnSite
                        ? 'The provider will confirm your request. Pay on site after the experience.'
                        : "The provider will confirm your request. You're only charged after they accept."}
                    </p>
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No availability for this date. Try another date.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function RequestTimeSlotsGrid({
  slots,
  selectedTime,
  isCustomRequest,
  onSelect,
  showLanguageSelector,
  preferredLanguage,
  onLanguageChange,
  languages,
  canContinue,
  onContinue,
  paymentMode,
  noteBelowSlots,
}: {
  slots: string[]
  selectedTime: string
  isCustomRequest: boolean
  onSelect: (time: string) => void
  showLanguageSelector: boolean
  preferredLanguage: string
  onLanguageChange: (lang: string) => void
  languages: string[]
  canContinue: boolean
  onContinue: () => void
  paymentMode: 'stripe' | 'pay_on_site'
  noteBelowSlots?: ReactNode
}) {
  const ctaNote = buildCtaNote({ paymentMode, isRequest: true })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {slots.map(slot => {
          const isSelected = selectedTime === slot && isCustomRequest
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              className={cn(
                'px-3 py-2.5 rounded-lg border text-center touch-manipulation transition-colors duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                isSelected
                  ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                  : 'border-border hover:border-accent/50 hover:bg-muted/30 bg-background'
              )}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-medium text-foreground">{slot}</span>
            </button>
          )
        })}
      </div>

      {noteBelowSlots}

      {showLanguageSelector && isCustomRequest && (
        <LanguageSelector
          value={preferredLanguage}
          onChange={onLanguageChange}
          languages={languages}
        />
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full py-3.5 bg-accent text-accent-foreground font-medium rounded-button hover:bg-accent-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Send Request
        </button>
        {ctaNote && <p className="text-[13px] text-muted-foreground text-center">{ctaNote}</p>}
      </div>
    </div>
  )
}
