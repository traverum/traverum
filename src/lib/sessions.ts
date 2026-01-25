import { createAdminClient } from './supabase/server'
import type { ExperienceSession } from './supabase/types'
import { startOfDay, addDays, format } from 'date-fns'

/**
 * Fetch available sessions for an experience
 */
export async function getAvailableSessions(
  experienceId: string,
  fromDate?: Date
): Promise<ExperienceSession[]> {
  const supabase = createAdminClient()
  
  const startDate = fromDate || startOfDay(new Date())
  const endDate = addDays(startDate, 90) // Show 90 days ahead
  
  const { data, error } = await supabase
    .from('experience_sessions')
    .select('*')
    .eq('experience_id', experienceId)
    .eq('session_status', 'available')
    .gte('session_date', format(startDate, 'yyyy-MM-dd'))
    .lte('session_date', format(endDate, 'yyyy-MM-dd'))
    .gt('spots_available', 0)
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
 * Check if a session has enough spots
 */
export function hasAvailableSpots(session: ExperienceSession, requestedSpots: number): boolean {
  return session.spots_available >= requestedSpots
}

/**
 * Get unique dates that have available sessions
 */
export function getAvailableDates(sessions: ExperienceSession[]): string[] {
  const dates = new Set(sessions.map(s => s.session_date))
  return Array.from(dates).sort()
}
