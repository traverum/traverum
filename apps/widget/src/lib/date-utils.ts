import { format } from 'date-fns'

/**
 * Get today's date in YYYY-MM-DD format using LOCAL timezone.
 * NEVER use new Date().toISOString() for this — it returns UTC.
 */
export function getTodayLocal(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd')
}

/**
 * Parse a YYYY-MM-DD date string as local midnight.
 * Use this instead of new Date(dateStr), which is interpreted as UTC midnight
 * and can yield the wrong calendar day in timezones west of UTC.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
