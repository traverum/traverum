// Server-only availability functions (uses Supabase admin client)
import { createAdminClient } from './supabase/server'
import type { AvailabilityRule } from './availability'

/**
 * Fetch availability rules for an experience from Supabase.
 * Server-only — do not import in client components.
 */
export async function getExperienceAvailability(
  experienceId: string
): Promise<AvailabilityRule[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('experience_availability')
    .select('*')
    .eq('experience_id', experienceId)

  if (error) {
    console.error('Error fetching availability:', error)
    return []
  }

  return (data || []).map((rule: any) => ({
    id: rule.id,
    experience_id: rule.experience_id,
    weekdays: rule.weekdays || [0, 1, 2, 3, 4, 5, 6],
    start_time: (rule.start_time || '08:00').slice(0, 5), // HH:MM
    end_time: (rule.end_time || '20:00').slice(0, 5),
    valid_from: rule.valid_from,
    valid_until: rule.valid_until,
  }))
}
