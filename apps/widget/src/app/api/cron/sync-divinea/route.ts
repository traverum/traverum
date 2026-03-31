import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAvailabilityExtended, type DivineaExtendedSlot } from '@/lib/divinea'
import { format, addDays } from 'date-fns'

const SYNC_DAYS = 90
const AVAILABLE_STATUSES = new Set(['AVAILABLE', 'FREESALE', 'LIMITED'])

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

function extractTime(startTime: string): string {
  const match = startTime.match(/T(\d{2}:\d{2}:\d{2})/)
  if (match) return match[1]
  const d = new Date(startTime)
  return [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join(':')
}

function isSlotAvailable(slot: DivineaExtendedSlot): boolean {
  return slot.active && slot.availableSeats > 0
}

interface SyncStats {
  experienceId: string
  experienceTitle?: string
  created: number
  updated: number
  cancelled: number
  slotsFromDivinea: number
  error?: string
}

async function syncExperience(
  supabase: ReturnType<typeof createAdminClient>,
  experience: {
    id: string
    title: string
    divinea_product_id: string
    divinea_option_id: string | null
  },
): Promise<SyncStats> {
  const stats: SyncStats = {
    experienceId: experience.id,
    experienceTitle: experience.title,
    created: 0,
    updated: 0,
    cancelled: 0,
    slotsFromDivinea: 0,
  }

  const today = format(new Date(), 'yyyy-MM-dd')
  const endDate = format(addDays(new Date(), SYNC_DAYS), 'yyyy-MM-dd')

  const slots = await getAvailabilityExtended(
    experience.divinea_product_id,
    experience.divinea_option_id,
    today,
    endDate,
  )

  const availableSlots = slots.filter(isSlotAvailable)
  stats.slotsFromDivinea = availableSlots.length

  const freshSlotIds = new Set<string>()

  for (const slot of availableSlots) {
    freshSlotIds.add(slot.id)

    const sessionRow = {
      experience_id: experience.id,
      divinea_slot_id: slot.id,
      session_date: slot.day,
      start_time: extractTime(slot.startTime),
      session_language: slot.enabledLanguages?.[0] ?? null,
      session_status: 'available',
      spots_available: 1,
      spots_total: 1,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('experience_sessions')
      .select('id')
      .eq('divinea_slot_id', slot.id)
      .maybeSingle()

    if (existing) {
      await (supabase.from('experience_sessions') as any)
        .update(sessionRow)
        .eq('id', existing.id)
      stats.updated++
    } else {
      await (supabase.from('experience_sessions') as any)
        .insert(sessionRow)
      stats.created++
    }
  }

  // Cancel sessions that DiVinea no longer returns
  const { data: existingSessions } = await supabase
    .from('experience_sessions')
    .select('id, divinea_slot_id')
    .eq('experience_id', experience.id)
    .not('divinea_slot_id', 'is', null)
    .neq('session_status', 'cancelled')

  for (const session of existingSessions ?? []) {
    if (session.divinea_slot_id && !freshSlotIds.has(session.divinea_slot_id)) {
      await (supabase.from('experience_sessions') as any)
        .update({
          session_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)
      stats.cancelled++
    }
  }

  return stats
}

async function handler(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: experiences, error } = await supabase
    .from('experiences')
    .select('id, title, divinea_product_id, divinea_option_id')
    .eq('calendar_source', 'divinea')
    .not('divinea_product_id', 'is', null)

  if (error) {
    console.error('sync-divinea: failed to query experiences:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!experiences || experiences.length === 0) {
    return NextResponse.json({
      message: 'No experiences with calendar_source=divinea found',
      synced: 0,
    })
  }

  const results: SyncStats[] = []

  for (const exp of experiences) {
    try {
      const stats = await syncExperience(supabase, {
        id: exp.id,
        title: exp.title,
        divinea_product_id: exp.divinea_product_id!,
        divinea_option_id: exp.divinea_option_id ?? null,
      })
      results.push(stats)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`sync-divinea: error syncing ${exp.id}:`, message)
      results.push({
        experienceId: exp.id,
        experienceTitle: exp.title,
        created: 0,
        updated: 0,
        cancelled: 0,
        slotsFromDivinea: 0,
        error: message,
      })
    }
  }

  const totals = results.reduce(
    (acc, r) => ({
      created: acc.created + r.created,
      updated: acc.updated + r.updated,
      cancelled: acc.cancelled + r.cancelled,
    }),
    { created: 0, updated: 0, cancelled: 0 },
  )

  return NextResponse.json({
    success: true,
    experiences: results.length,
    ...totals,
    details: results,
  })
}

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
