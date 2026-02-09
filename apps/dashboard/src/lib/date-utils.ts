import { format } from 'date-fns';

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone.
 * NEVER use new Date().toISOString() for this — it returns UTC.
 */
export function getTodayLocal(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd');
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
