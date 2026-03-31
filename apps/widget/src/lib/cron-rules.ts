/**
 * Determine whether a confirmed booking should be auto-completed.
 * A booking is auto-completed when the experience date was 7+ days ago.
 */
export function shouldAutoComplete(
  experienceDate: string | null | undefined,
  sevenDaysAgoCutoff: string
): boolean {
  if (!experienceDate) return false
  return experienceDate <= sevenDaysAgoCutoff
}

/**
 * Determine whether a pending reservation should expire.
 * A reservation expires when the supplier hasn't responded within the response deadline.
 */
export function shouldExpirePending(
  reservationStatus: string,
  responseDeadline: string,
  now: string
): boolean {
  return reservationStatus === 'pending' && responseDeadline < now
}

/**
 * Determine whether an approved-but-unpaid reservation should expire.
 * An approved reservation expires when the guest hasn't paid within the payment deadline,
 * unless a booking already exists (race condition: payment arrived after deadline but before cron).
 */
export function shouldExpireUnpaid(
  reservationStatus: string,
  paymentDeadline: string,
  now: string,
  hasExistingBooking: boolean
): boolean {
  if (hasExistingBooking) return false
  return reservationStatus === 'approved' && paymentDeadline < now
}

/**
 * Determine whether a confirmed booking is due for a completion check email.
 * Fires once the experience end time has passed.
 *
 * For session-based bookings we know the exact end_time.
 * For request-based bookings we compute end time from start_time + duration.
 * Fallback: if no time info is available, fires the day after the experience.
 */
export function isCompletionCheckDue(
  experienceDate: string | null | undefined,
  nowISO: string,
  endTime?: string | null,
  startTime?: string | null,
  durationMinutes?: number | null,
): boolean {
  if (!experienceDate) return false

  const resolvedEndTime = endTime ?? computeEndTime(startTime, durationMinutes)

  if (resolvedEndTime) {
    const endDatetime = new Date(`${experienceDate}T${resolvedEndTime}:00Z`)
    if (isNaN(endDatetime.getTime())) return false
    return new Date(nowISO) >= endDatetime
  }

  // Fallback: no time info → fire starting midnight (UTC) after the experience date
  const dayAfter = new Date(`${experienceDate}T00:00:00Z`)
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)
  return new Date(nowISO) >= dayAfter
}

/**
 * Compute an end time string (HH:MM) from a start time and duration.
 * Returns null if either input is missing.
 */
export function computeEndTime(
  startTime: string | null | undefined,
  durationMinutes: number | null | undefined,
): string | null {
  if (!startTime || !durationMinutes) return null

  const [hours, minutes] = startTime.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return null

  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

/**
 * Resolve the canonical experience date from a booking's related data.
 * Used by cron jobs that process bookings with nested reservation/session data.
 */
export function resolveBookingExperienceDate(
  sessionDate: string | null | undefined,
  requestedDate: string | null | undefined
): string | null {
  return sessionDate || requestedDate || null
}
