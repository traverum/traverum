// Availability helper functions for experience scheduling in the widget
// This file is CLIENT-SAFE — no server-only imports.
// Server-side fetch is in availability.server.ts

export interface AvailabilityRule {
  id: string
  experience_id: string
  weekdays: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  valid_from: string | null // YYYY-MM-DD or null for year-round
  valid_until: string | null // YYYY-MM-DD or null for year-round
}

/**
 * Check if a specific date is available based on availability rules
 */
export function isDateAvailable(
  date: Date,
  rules: AvailabilityRule[]
): boolean {
  // No rules = always available (backwards compatible)
  if (rules.length === 0) return true

  const dayOfWeek = date.getDay()
  const dateStr = formatDateForComparison(date)

  return rules.some((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false
    if (rule.valid_from && dateStr < rule.valid_from) return false
    if (rule.valid_until && dateStr > rule.valid_until) return false
    return true
  })
}

/**
 * Get operating hours for a specific date
 */
export function getOperatingHours(
  date: Date,
  rules: AvailabilityRule[]
): { start: string; end: string } | null {
  if (rules.length === 0) return null

  const dayOfWeek = date.getDay()
  const dateStr = formatDateForComparison(date)

  const matchingRule = rules.find((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false
    if (rule.valid_from && dateStr < rule.valid_from) return false
    if (rule.valid_until && dateStr > rule.valid_until) return false
    return true
  })

  if (!matchingRule) return null

  return {
    start: matchingRule.start_time,
    end: matchingRule.end_time,
  }
}

/**
 * Generate hourly time slots within operating hours.
 * Returns time strings in HH:MM format.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string
): string[] {
  const [startH] = startTime.split(':').map(Number)
  const [endH] = endTime.split(':').map(Number)

  const slots: string[] = []
  for (let h = startH; h < endH; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
  }
  return slots
}

/**
 * Group time slots into morning / afternoon / evening
 */
export function groupTimeSlots(slots: string[]): {
  morning: string[]
  afternoon: string[]
  evening: string[]
} {
  const morning: string[] = []
  const afternoon: string[] = []
  const evening: string[] = []

  for (const slot of slots) {
    const hour = parseInt(slot.split(':')[0], 10)
    if (hour < 12) {
      morning.push(slot)
    } else if (hour < 18) {
      afternoon.push(slot)
    } else {
      evening.push(slot)
    }
  }

  return { morning, afternoon, evening }
}

// Default fallback time groups (used when no availability rules exist)
export const DEFAULT_TIME_GROUPS = {
  morning: ['08:00', '09:00', '10:00', '11:00'],
  afternoon: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  evening: ['18:00', '19:00', '20:00', '21:00'],
}

function formatDateForComparison(date: Date): string {
  return date.toISOString().split('T')[0]
}
