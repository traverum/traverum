import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyticsLimiter, getClientIp } from '@/lib/rate-limit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const VALID_EVENT_TYPES = new Set(['widget_view', 'experience_view', 'experience_details'])
const VALID_SOURCES = new Set(['email', 'nfc', 'website', 'qr', 'direct'])
const VALID_EMBED_MODES = new Set(['full', 'section', 'standalone'])
const MAX_EVENTS_PER_REQUEST = 20

interface TrackEventPayload {
  event_type: string
  hotel_config_id?: string | null
  experience_id?: string | null
  source?: string | null
  embed_mode?: string | null
  session_id?: string | null
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  if (process.env.KV_REST_API_URL) {
    const ip = getClientIp(request)
    const { success } = await analyticsLimiter.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: CORS_HEADERS })
    }
  }

  try {
    const body = await request.json()
    const events: TrackEventPayload[] = Array.isArray(body.events) ? body.events : body.event_type ? [body] : []

    if (events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400, headers: CORS_HEADERS })
    }

    if (events.length > MAX_EVENTS_PER_REQUEST) {
      return NextResponse.json({ error: `Max ${MAX_EVENTS_PER_REQUEST} events per request` }, { status: 400, headers: CORS_HEADERS })
    }

    const validated = events
      .filter(e => VALID_EVENT_TYPES.has(e.event_type))
      .map(e => ({
        event_type: e.event_type,
        hotel_config_id: e.hotel_config_id || null,
        experience_id: e.experience_id || null,
        source: e.source && VALID_SOURCES.has(e.source) ? e.source : null,
        embed_mode: e.embed_mode && VALID_EMBED_MODES.has(e.embed_mode) ? e.embed_mode : null,
        session_id: e.session_id?.slice(0, 64) || null,
      }))

    if (validated.length === 0) {
      return NextResponse.json({ error: 'No valid events' }, { status: 400, headers: CORS_HEADERS })
    }

    const supabase = createAdminClient()
    await (supabase.from('analytics_events') as any).insert(validated)

    return NextResponse.json({ ok: true, count: validated.length }, { headers: CORS_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: CORS_HEADERS })
  }
}
