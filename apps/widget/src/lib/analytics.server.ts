import { createAdminClient } from '@/lib/supabase/server'

interface AnalyticsEventInsert {
  event_type: string
  hotel_config_id?: string | null
  experience_id?: string | null
  source?: string | null
  embed_mode?: string | null
  session_id?: string | null
}

const VALID_SOURCES = new Set(['email', 'nfc', 'website', 'qr', 'direct'])

export function parseSource(raw: string | undefined | null): string | null {
  if (!raw) return null
  return VALID_SOURCES.has(raw) ? raw : null
}

export async function logAnalyticsEvent(event: AnalyticsEventInsert) {
  try {
    const supabase = createAdminClient()
    await supabase.from('analytics_events').insert({
      event_type: event.event_type,
      hotel_config_id: event.hotel_config_id || null,
      experience_id: event.experience_id || null,
      source: event.source || null,
      embed_mode: event.embed_mode || null,
      session_id: event.session_id || null,
    })
  } catch {
    // Analytics should never break the page
  }
}
