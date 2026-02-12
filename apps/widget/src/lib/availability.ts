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
 * If endTime has non-zero minutes (e.g. 20:30), that hour is included as a valid start.
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string
): string[] {
  const [startH] = startTime.split(':').map(Number)
  const [endH, endM = 0] = endTime.split(':').map(Number)

  // Include the end hour if there are remaining minutes
  // e.g. end 20:30 → slots up to 20:00 are valid (session starts before cutoff)
  const effectiveEnd = endM > 0 ? endH + 1 : endH

  const slots: string[] = []
  for (let h = startH; h < effectiveEnd; h++) {
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

// Cancellation policy (matches dashboard/availability.ts)
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non_refundable'

export const CANCELLATION_POLICIES: {
  value: CancellationPolicy
  label: string
  description: string
  minDaysBeforeCancel: number // minimum days before experience to allow free cancellation
}[] = [
  { value: 'flexible', label: 'Flexible', description: 'Free cancellation up to 24 hours before', minDaysBeforeCancel: 1 },
  { value: 'moderate', label: 'Moderate', description: 'Free cancellation up to 7 days before', minDaysBeforeCancel: 7 },
  { value: 'strict', label: 'Strict', description: 'No refunds after booking is confirmed', minDaysBeforeCancel: 0 },
  { value: 'non_refundable', label: 'Non-refundable', description: 'No refunds for guest cancellations', minDaysBeforeCancel: 0 },
]

/**
 * Generate display text for cancellation policy (+ force majeure note if applicable)
 */
export function getCancellationPolicyText(
  policy: CancellationPolicy | string | null | undefined,
  forceMajeureRefund?: boolean
): string {
  const p = (policy || 'moderate') as CancellationPolicy
  const info = CANCELLATION_POLICIES.find((x) => x.value === p)
  let text = info?.description ?? 'Free cancellation up to 7 days before.'
  if (forceMajeureRefund) {
    text += ' Full refund if cancelled by supplier due to weather or emergency.'
  }
  return text
}

/**
 * Check if guest can cancel for refund based on policy and days until experience.
 * Returns { canCancel: boolean, message: string }
 */
export function canGuestCancel(
  policy: CancellationPolicy | string | null | undefined,
  daysUntilExperience: number
): { canCancel: boolean; message: string } {
  const p = (policy || 'moderate') as CancellationPolicy
  const info = CANCELLATION_POLICIES.find((x) => x.value === p)
  const minDays = info?.minDaysBeforeCancel ?? 7

  if (minDays === 0) {
    return {
      canCancel: false,
      message: p === 'strict'
        ? 'Cancellation is not available. No refunds after booking is confirmed.'
        : 'Cancellation is not available. This booking is non-refundable.',
    }
  }

  if (daysUntilExperience < minDays) {
    return {
      canCancel: false,
      message: `Cancellation is no longer available. You can only cancel up to ${minDays} ${minDays === 1 ? 'day' : 'days'} before the experience. (${daysUntilExperience} ${daysUntilExperience === 1 ? 'day' : 'days'} remaining)`,
    }
  }

  return {
    canCancel: true,
    message: 'Your booking has been cancelled and a refund has been initiated.',
  }
}
