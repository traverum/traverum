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
 * The check fires the day after the experience (experienceDate === yesterday).
 */
export function isCompletionCheckDue(
  experienceDate: string | null | undefined,
  yesterday: string
): boolean {
  if (!experienceDate) return false
  return experienceDate === yesterday
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
