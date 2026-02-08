'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, Mail } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { formatTime, cn } from '@/lib/utils'
import {
  isDateAvailable,
  getOperatingHours,
  generateTimeSlots,
  groupTimeSlots,
  DEFAULT_TIME_GROUPS,
} from '@/lib/availability'
import type { AvailabilityRule } from '@/lib/availability'
import type { ExperienceSession } from '@/lib/supabase/types'

interface SessionPickerProps {
  sessions: ExperienceSession[]
  selectedSessionId: string | null
  isCustomRequest: boolean
  customDate: string
  customTime: string
  onSessionSelect: (sessionId: string | null, isCustom: boolean) => void
  onCustomDateChange: (date: string) => void
  onCustomTimeChange: (time: string) => void
  participants: number
  availabilityRules?: AvailabilityRule[]
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
  customTime,
  onSessionSelect,
  onCustomDateChange,
  onCustomTimeChange,
  participants,
  availabilityRules = [],
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

  // Generate dynamic time groups based on availability rules for the selected date
  const timeGroups = useMemo(() => {
    if (!selectedCalendarDate || availabilityRules.length === 0) {
      return DEFAULT_TIME_GROUPS
    }

    const hours = getOperatingHours(selectedCalendarDate, availabilityRules)
    if (!hours) {
      return DEFAULT_TIME_GROUPS
    }

    const slots = generateTimeSlots(hours.start, hours.end)
    return groupTimeSlots(slots)
  }, [selectedCalendarDate, availabilityRules])

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
        onCustomTimeChange('')
      } else {
        // Date has no sessions - this is a request
        onSessionSelect(null, true)
      }
    } else {
      // Date cleared
      onCustomDateChange('')
      onCustomTimeChange('')
      onSessionSelect(null, false)
    }
  }

  // Handle time selection for custom request
  const handleTimeSelect = (time: string) => {
    onCustomTimeChange(time)
    onSessionSelect(null, true)
  }

  // Handle selecting a confirmed session
  const handleSessionSelect = (sessionId: string) => {
    onSessionSelect(sessionId, false)
    // Clear custom request when selecting a session
    onCustomTimeChange('')
  }

  // Check if there are any time slots to show
  const hasTimeSlots = timeGroups.morning.length > 0 || timeGroups.afternoon.length > 0 || timeGroups.evening.length > 0

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
                            <Check className="w-2.5 h-2.5 text-accent-foreground" aria-hidden="true" />
                          </div>
                        )}
                        <div className="text-sm font-medium text-foreground mb-0.5">
                          {formatTime(session.start_time)}
                        </div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">
                          {session.spots_available} {session.spots_available === 1 ? 'spot' : 'spots'} left
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show time picker if date has no sessions (request flow) */}
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
                    No sessions available. Request your preferred time.
                  </p>
                </div>

                {/* How it works */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>Provider confirms within 48h → You pay after approval</span>
                </div>
                  
                {hasTimeSlots ? (
                  <fieldset className="space-y-3">
                    <legend className="sr-only">Select a time</legend>
                    
                    {/* Morning */}
                    {timeGroups.morning.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Morning</p>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Morning times">
                          {timeGroups.morning.map((time) => {
                            const isSelected = customTime === time && isCustomRequest
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleTimeSelect(time)}
                                aria-pressed={isSelected}
                                className={cn(
                                  'px-3 py-1.5 text-xs rounded-button border touch-manipulation',
                                  'transition-colors duration-150',
                                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                                  isSelected
                                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                                    : 'border-border bg-background hover:border-accent/50 hover:bg-muted/30 text-foreground'
                                )}
                              >
                                {time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon */}
                    {timeGroups.afternoon.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Afternoon</p>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Afternoon times">
                          {timeGroups.afternoon.map((time) => {
                            const isSelected = customTime === time && isCustomRequest
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleTimeSelect(time)}
                                aria-pressed={isSelected}
                                className={cn(
                                  'px-3 py-1.5 text-xs rounded-button border touch-manipulation',
                                  'transition-colors duration-150',
                                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                                  isSelected
                                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                                    : 'border-border bg-background hover:border-accent/50 hover:bg-muted/30 text-foreground'
                                )}
                              >
                                {time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Evening */}
                    {timeGroups.evening.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Evening</p>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Evening times">
                          {timeGroups.evening.map((time) => {
                            const isSelected = customTime === time && isCustomRequest
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => handleTimeSelect(time)}
                                aria-pressed={isSelected}
                                className={cn(
                                  'px-3 py-1.5 text-xs rounded-button border touch-manipulation',
                                  'transition-colors duration-150',
                                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
                                  isSelected
                                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                                    : 'border-border bg-background hover:border-accent/50 hover:bg-muted/30 text-foreground'
                                )}
                              >
                                {time}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </fieldset>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No time slots available for this date.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
