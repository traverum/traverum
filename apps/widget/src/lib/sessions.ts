import { createAdminClient } from './supabase/server'
import type { ExperienceSession } from './supabase/types'
import { startOfDay, addDays, subDays, format } from 'date-fns'

/**
 * Fetch available sessions for an experience.
 * Only sessions with status 'available' are shown in the widget.
 * Sessions with status 'booked' (claimed by a group or created from accepted request)
 * are not visible to other guests.
 */
export async function getAvailableSessions(
  experienceId: string,
  fromDate?: Date
): Promise<ExperienceSession[]> {
  const supabase = createAdminClient()
  
  // Use "yesterday" server time when no fromDate, so "today" in any timezone is always included
  const startDate = fromDate || startOfDay(subDays(new Date(), 1))
  const endDate = addDays(startDate, 91)
  
  const { data, error } = await supabase
    .from('experience_sessions')
    .select('*')
    .eq('experience_id', experienceId)
    .eq('session_status', 'available')
    .gte('session_date', format(startDate, 'yyyy-MM-dd'))
    .lte('session_date', format(endDate, 'yyyy-MM-dd'))
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
  
  return data || []
}

/**
 * Get sessions grouped by date
 */
export function groupSessionsByDate(sessions: ExperienceSession[]): Map<string, ExperienceSession[]> {
  const grouped = new Map<string, ExperienceSession[]>()
  
  for (const session of sessions) {
    const dateKey = session.session_date
    const existing = grouped.get(dateKey) || []
    grouped.set(dateKey, [...existing, session])
  }
  
  return grouped
}

/**
 * Get unique dates that have available sessions
 */
export function getAvailableDates(sessions: ExperienceSession[]): string[] {
  const dates = new Set(sessions.map(s => s.session_date))
  return Array.from(dates).sort()
}
