import { format } from 'date-fns';

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone.
 * NEVER use new Date().toISOString() for this — it returns UTC.
 */
export function getTodayLocal(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD date string as local midnight.
 * Use this instead of new Date(dateStr), which is interpreted as UTC midnight
 * and can yield the wrong calendar day in timezones west of UTC.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Check if a session is upcoming (hasn't started yet).
 * Session dates and times are stored in local timezone without timezone info.
 */
export function isSessionUpcoming(
  sessionDate: string,
  startTime: string,
  now: Date = new Date()
): boolean {
  const todayLocal = getTodayLocal(now);

  // Future dates are always upcoming
  if (sessionDate > todayLocal) return true;

  // Past dates are never upcoming
  if (sessionDate < todayLocal) return false;

  // For today's sessions, compare hours and minutes directly
  const [h, m] = startTime.split(':').map(Number);
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();

  if (h > nowHour) return true;
  if (h === nowHour && m > nowMinute) return true;
  return false;
}

/**
 * Whether a confirmed booking's "end moment" has passed (so it should show as past).
 * - Session-based: end = session_date + start_time + duration_minutes (local time).
 * - Rental: end = end of rental_end_date (past when today > rental_end_date).
 */
export function isBookingEnded(
  booking: {
    date: string;
    time: string | null;
    isRental: boolean;
    rentalEndDate: string | null;
    experience: { durationMinutes?: number | null };
  },
  now: Date = new Date()
): boolean {
  const todayLocal = getTodayLocal(now);

  if (booking.isRental && booking.rentalEndDate) {
    return booking.rentalEndDate < todayLocal;
  }

  // Session-based: end = date + start_time + duration
  if (booking.date < todayLocal) return true;
  if (booking.date > todayLocal) return false;

  const startTime = booking.time || '00:00';
  const [h, m] = startTime.split(':').map(Number);
  const durationMinutes = booking.experience?.durationMinutes ?? 0;
  const endMinutes = h * 60 + m + durationMinutes;
  const endHour = Math.floor(endMinutes / 60) % 24;
  const endMin = endMinutes % 60;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const endMinutesOfDay = endHour * 60 + endMin;

  return nowMinutes >= endMinutesOfDay;
}
