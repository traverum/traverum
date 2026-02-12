'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { format } from 'date-fns'
import { formatTime, cn } from '@/lib/utils'
import { isDateAvailable, getOperatingHours, generateTimeSlots, DEFAULT_TIME_GROUPS } from '@/lib/availability'
import type { AvailabilityRule } from '@/lib/availability'
import type { ExperienceSession } from '@/lib/supabase/types'

// Dynamic import of Calendar to avoid MUI Emotion SSR hydration mismatch
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then(mod => ({ default: mod.Calendar })),
  { ssr: false, loading: () => <div className="w-full h-[320px] rounded-lg border border-border animate-pulse bg-muted/30" /> }
)

interface SessionPickerProps {
  sessions: ExperienceSession[]
  selectedSessionId: string | null
  isCustomRequest: boolean
  customDate: string
  requestTime: string
  onSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  onCustomDateChange: (date: string) => void
  onRequestTimeChange: (time: string) => void
  participants: number
  availabilityRules?: AvailabilityRule[]
  /** Minimum total participants for a session to run (experience.min_participants). Default 1 = no threshold. */
  minParticipants?: number
}

// Animation variants with reduced motion support
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const slideInVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0 },
}

export function SessionPicker({
  sessions,
  selectedSessionId,
  isCustomRequest,
  customDate,
  requestTime,
  onSessionSelect,
  onCustomDateChange,
  onRequestTimeChange,
  participants,
  availabilityRules = [],
  minParticipants = 1,
}: SessionPickerProps) {
  const shouldReduceMotion = useReducedMotion()
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(
    customDate ? new Date(customDate) : undefined
  )
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter sessions based on participants
  const availableSessions = useMemo(() => {
    return sessions.filter(session => session.spots_available >= participants)
  }, [sessions, participants])

  // Group sessions by date (YYYY-MM-DD format)
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, ExperienceSession[]> = {}
    availableSessions.forEach(session => {
      const dateKey = format(new Date(session.session_date), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(session)
    })
    return grouped
  }, [availableSessions])

  // Check if a date has sessions
  const dateHasSessions = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return !!sessionsByDate[dateKey] && sessionsByDate[dateKey].length > 0
  }

  // Get sessions for selected date
  const selectedDateSessions = useMemo(() => {
    if (!selectedCalendarDate) return []
    const dateKey = format(selectedCalendarDate, 'yyyy-MM-dd')
    return sessionsByDate[dateKey] || []
  }, [selectedCalendarDate, sessionsByDate])

  // Check if a date should be disabled (past or not available per rules)
  const isDateDisabled = useMemo(() => {
    return (date: Date): boolean => {
      const dateOnly = new Date(date)
      dateOnly.setHours(0, 0, 0, 0)
      // Disable past dates
      if (dateOnly < today) return true
      // Disable dates not matching availability rules
      if (availabilityRules.length > 0 && !isDateAvailable(dateOnly, availabilityRules)) {
        return true
      }
      return false
    }
  }, [availabilityRules, today])

  // Handle calendar date selection
  const handleCalendarDateSelect = (date: Date | undefined) => {
    setSelectedCalendarDate(date)
    if (date) {
      const dateKey = format(date, 'yyyy-MM-dd')
      onCustomDateChange(dateKey)
      
      if (dateHasSessions(date)) {
        // Date has sessions - clear custom request, user will select a session
        onSessionSelect(null, false)
        onRequestTimeChange('')
      } else {
        // Date has no sessions - this is a request
        onSessionSelect(null, true)
        onRequestTimeChange('')
      }
    } else {
      // Date cleared
      onCustomDateChange('')
      onRequestTimeChange('')
      onSessionSelect(null, false)
    }
  }

  // Handle selecting a confirmed session
  const handleSessionSelect = (sessionId: string) => {
    onSessionSelect(sessionId, false)
    // Clear request time when selecting a session
    onRequestTimeChange('')
  }

  // Handle selecting a time slot for a request
  const handleRequestTimeSelect = (time: string) => {
    onRequestTimeChange(time)
    onSessionSelect(null, true)
  }

  // Generate available time slots for a request date
  const requestTimeSlots = useMemo(() => {
    if (!selectedCalendarDate || selectedDateSessions.length > 0) return []
    
    const hours = getOperatingHours(selectedCalendarDate, availabilityRules)
    if (hours) {
      return generateTimeSlots(hours.start, hours.end)
    }
    
    // No availability rules - use defaults
    return [
      ...DEFAULT_TIME_GROUPS.morning,
      ...DEFAULT_TIME_GROUPS.afternoon,
      ...DEFAULT_TIME_GROUPS.evening,
    ]
  }, [selectedCalendarDate, selectedDateSessions, availabilityRules])

  return (
    <div className="font-body">
      {/* Desktop: side-by-side layout, Mobile: stacked */}
      <div className="flex flex-col md:flex-row md:gap-6 md:items-start">
        {/* Calendar */}
        <div className="flex justify-center md:flex-shrink-0">
          <Calendar
            selected={selectedCalendarDate}
            onSelect={handleCalendarDateSelect}
            disabled={isDateDisabled}
            datesWithSessions={Object.keys(sessionsByDate)}
            className="rounded-lg border border-border p-2"
          />
        </div>

        {/* Sessions/Times - Right side on desktop, below on mobile */}
        <div className="flex-1 mt-4 md:mt-0 min-w-0">
          {/* Show sessions if date has sessions */}
          <AnimatePresence mode="wait">
            {selectedCalendarDate && selectedDateSessions.length > 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : slideInVariants.hidden}
                animate={slideInVariants.visible}
                exit={shouldReduceMotion ? undefined : fadeInVariants.hidden}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="space-y-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {format(selectedCalendarDate, 'EEEE, d MMMM')}
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {selectedDateSessions.map((session) => {
                    const isSelected = selectedSessionId === session.id && !isCustomRequest
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleSessionSelect(session.id)}
                        className={cn(
                          'relative px-3 py-2.5 rounded-lg border text-left touch-manipulation',
                          'transition-colors duration-150',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                          isSelected
                            ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                            : 'border-border hover:border-accent/50 hover:bg-muted/30 bg-background'
                        )}
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-accent-foreground" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" /></svg>
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-0.5">
                          {formatTime(session.start_time)}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {(() => {
                            const booked = session.spots_total - session.spots_available
                            if (minParticipants > 1 && booked < minParticipants) {
                              return `${booked}/${minParticipants} min. booked`
                            }
                            return `${session.spots_available} ${session.spots_available === 1 ? 'spot' : 'spots'} left`
                          })()}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show time slots for request if date has no sessions */}
          <AnimatePresence mode="wait">
            {selectedCalendarDate && selectedDateSessions.length === 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : slideInVariants.hidden}
                animate={slideInVariants.visible}
                exit={shouldReduceMotion ? undefined : fadeInVariants.hidden}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {format(selectedCalendarDate, 'EEEE, d MMMM')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No sessions yet. Pick a time to send a request.
                  </p>
                </div>

                {/* How it works */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect width="20" height="16" x="2" y="4" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  <span>Provider responds within 48h. You pay after they approve.</span>
                </div>

                {/* Time slot grid */}
                {requestTimeSlots.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      Select a time
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {requestTimeSlots.map((slot) => {
                        const isSelected = requestTime === slot && isCustomRequest
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleRequestTimeSelect(slot)}
                            className={cn(
                              'px-3 py-2.5 rounded-lg border text-center touch-manipulation',
                              'transition-colors duration-150',
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
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
