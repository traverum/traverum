import { createAdminClient } from '@/lib/supabase/server'
import type { HotelConfig } from '@/lib/supabase/types'

export interface ReceptionistExperience {
  id: string
  title: string
  slug: string
  description: string
  image_url: string | null
  coverImage: string | null
  price_cents: number
  pricing_type: string
  base_price_cents: number
  extra_person_cents: number
  included_participants: number
  price_per_day_cents: number
  min_days: number
  max_days: number | null
  duration_minutes: number
  min_participants: number
  max_participants: number
  meeting_point: string | null
  location_address: string | null
  location: unknown
  tags: string[]
  cancellation_policy: string | null
  available_languages: string[]
  allows_requests: boolean | null
  hotel_notes?: string | null
  currency: string
  supplier: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  distance_km: number | null
  isSelected: boolean
  nextSession?: { date: string; time: string } | null
}

/**
 * Fetch experiences the hotel has selected (active distributions)
 */
export async function getSelectedExperiences(
  hotelConfigId: string,
  hotelPartnerId?: string
): Promise<ReceptionistExperience[]> {
  const supabase = createAdminClient()

  // Prefer hotel_config_id; fallback to hotel_id for branches where config_id may be unset
  // partners: omit phone so branch schemas without partners.phone don't break
  let query = (supabase.from('distributions') as any)
    .select(`
      *,
      experiences (
        *,
        partners (id, name, email)
      )
    `)
    .order('id', { ascending: true })

  const { data: byConfigId, error: err1 } = await query.eq('hotel_config_id', hotelConfigId)

  if (process.env.NODE_ENV === 'development') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const projectRef = url.replace(/^https:\/\//, '').split('.')[0]
    console.warn('[receptionist] getSelectedExperiences by hotel_config_id:', {
      projectRef,
      hotelConfigId,
      count: byConfigId?.length ?? 0,
      error: err1?.message ?? null,
      firstRowKeys: byConfigId?.[0] ? Object.keys(byConfigId[0]) : [],
    })
  }

  let distributionsData = byConfigId
  let error = err1

  if ((error || !distributionsData || distributionsData.length === 0) && hotelPartnerId) {
    const { data: byHotelId, error: err2 } = await (supabase.from('distributions') as any)
      .select(`
        *,
        experiences (
          *,
          partners (id, name, email)
        )
      `)
      .eq('hotel_id', hotelPartnerId)
      .order('id', { ascending: true })
    if (!err2 && byHotelId?.length) {
      distributionsData = byHotelId
      error = null
    }
  }

  if (error || !distributionsData) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[receptionist] getSelectedExperiences returning []:', { error: error?.message, hasData: !!distributionsData?.length })
    }
    return []
  }

  const distributions = distributionsData as any[]

  const experienceIds = distributions.map(
    (d: any) => d.experiences?.id ?? d.experience?.id
  ).filter(Boolean)

  const { data: mediaList } = await supabase
    .from('media')
    .select('*')
    .in('experience_id', experienceIds)
    .order('sort_order', { ascending: true })

  const mediaData = (mediaList || []) as any[]

  const active = distributions.filter((d: any) => {
    const exp = d.experiences ?? d.experience
    return exp && exp.experience_status === 'active'
  })
  if (process.env.NODE_ENV === 'development') {
    console.warn('[receptionist] getSelectedExperiences after active filter:', {
      totalDistributions: distributions.length,
      activeCount: active.length,
      firstExpStatus: distributions[0] ? (distributions[0].experiences ?? distributions[0].experience)?.experience_status : null,
    })
  }
  return active.map((d: any) => {
      const exp = d.experiences ?? d.experience
      const supplier = exp.partners ?? exp.supplier ?? {}
      const expMedia = mediaData.filter((m: any) => m.experience_id === exp.id)
      return {
        id: exp.id,
        title: exp.title,
        slug: exp.slug,
        description: exp.description ?? '',
        image_url: exp.image_url ?? null,
        coverImage: expMedia[0]?.url ?? exp.image_url ?? null,
        price_cents: exp.price_cents ?? 0,
        pricing_type: exp.pricing_type ?? 'per_person',
        base_price_cents: exp.base_price_cents ?? 0,
        extra_person_cents: exp.extra_person_cents ?? 0,
        included_participants: exp.included_participants ?? 0,
        price_per_day_cents: exp.price_per_day_cents ?? 0,
        min_days: exp.min_days ?? 1,
        max_days: exp.max_days ?? null,
        duration_minutes: exp.duration_minutes ?? 60,
        min_participants: exp.min_participants ?? 1,
        max_participants: exp.max_participants ?? 10,
        meeting_point: exp.meeting_point ?? null,
        location_address: exp.location_address ?? null,
        location: exp.location ?? null,
        tags: exp.tags || [],
        cancellation_policy: exp.cancellation_policy ?? null,
        available_languages: exp.available_languages || [],
        allows_requests: exp.allows_requests ?? null,
        hotel_notes: exp.hotel_notes ?? null,
        currency: exp.currency ?? 'EUR',
        supplier: {
          id: supplier.id ?? '',
          name: supplier.name ?? '',
          email: supplier.email ?? '',
          phone: supplier.phone ?? null,
        },
        distance_km: null,
        isSelected: true,
        nextSession: null,
      }
    })
}

/**
 * Fetch all active experiences within the hotel's radius using PostGIS RPC
 */
export async function getNearbyExperiences(hotelConfig: HotelConfig): Promise<ReceptionistExperience[]> {
  const supabase = createAdminClient()

  const config = hotelConfig as any
  if (!config.location) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[receptionist] getNearbyExperiences: no location on hotel config')
    }
    return []
  }

  let lat: number | null = null
  let lng: number | null = null

  if (typeof config.location === 'string') {
    const s = config.location.trim()
    const wktMatch = s.match(/POINT\s*\(\s*([^\s,)]+)\s+([^\s,)]+)\s*\)/i)
    if (wktMatch) {
      lng = parseFloat(wktMatch[1])
      lat = parseFloat(wktMatch[2])
    } else {
      try {
        const parsed = JSON.parse(s) as { type?: string; coordinates?: [number, number] }
        if (parsed?.coordinates?.length >= 2) {
          lng = parsed.coordinates[0]
          lat = parsed.coordinates[1]
        }
      } catch {
        const twoNumbers = s.match(/(-?\d+\.?\d*)\s*[, \t]\s*(-?\d+\.?\d*)/)
        if (twoNumbers) {
          const a = parseFloat(twoNumbers[1])
          const b = parseFloat(twoNumbers[2])
          if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
            lng = a
            lat = b
          } else if (Math.abs(b) <= 180 && Math.abs(a) <= 90) {
            lng = b
            lat = a
          } else {
            lng = a
            lat = b
          }
        }
      }
    }
  } else if (config.location && typeof config.location === 'object') {
    const loc = config.location as { coordinates?: [number, number] }
    if (loc.coordinates?.length >= 2) {
      lng = loc.coordinates[0]
      lat = loc.coordinates[1]
    }
  }

  if (lat === null || lng === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[receptionist] getNearbyExperiences: could not parse location', { type: typeof config.location })
    }
    return []
  }

  const radiusKm = config.location_radius_km || 25
  const radiusMeters = radiusKm * 1000
  const locationWkt = `POINT(${lng} ${lat})`

  const excludePartnerId = config.partner_id ?? null
  if (excludePartnerId === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[receptionist] getNearbyExperiences: no partner_id on hotel config')
    }
    return []
  }

  const { data, error } = await (supabase as any).rpc('get_experiences_within_radius', {
    hotel_location: locationWkt,
    radius_meters: radiusMeters,
    exclude_partner_id: excludePartnerId,
  })

  if (error || !data) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[receptionist] getNearbyExperiences RPC:', { error: error?.message, count: Array.isArray(data) ? data.length : 0 })
    }
    return []
  }

  const experiences = data as any[]

  const supplierIds = Array.from(new Set(experiences.map((e: any) => e.supplier_id))) as string[]
  const experienceIds = experiences.map((e: any) => e.id)

  // Fetch supplier contacts and media in parallel
  const [{ data: suppliersData }, { data: mediaList }] = await Promise.all([
    supabase.from('partners').select('id, name, email, phone').in('id', supplierIds),
    supabase.from('media').select('experience_id, url, sort_order').in('experience_id', experienceIds).order('sort_order', { ascending: true }),
  ])

  const suppliersMap = new Map(
    ((suppliersData || []) as any[]).map(s => [s.id, s])
  )
  const mediaData = (mediaList || []) as any[]

  return experiences.map(exp => {
    const supplier = suppliersMap.get(exp.supplier_id) || {
      id: exp.supplier_id,
      name: exp.supplier_name,
      email: '',
      phone: null,
    }
    const expMedia = mediaData.filter((m: any) => m.experience_id === exp.id)

    return {
      id: exp.id,
      title: exp.title,
      slug: exp.slug,
      description: exp.description || '',
      image_url: exp.image_url,
      coverImage: expMedia[0]?.url ?? exp.image_url ?? null,
      price_cents: exp.price_cents,
      pricing_type: 'per_person',
      base_price_cents: 0,
      extra_person_cents: exp.price_cents,
      included_participants: 0,
      price_per_day_cents: 0,
      min_days: 1,
      max_days: null,
      duration_minutes: exp.duration_minutes,
      min_participants: 1,
      max_participants: exp.max_participants,
      meeting_point: exp.meeting_point,
      location_address: null,
      location: exp.location,
      tags: exp.tags || [],
      cancellation_policy: null,
      available_languages: [],
      allows_requests: null,
      hotel_notes: null,
      currency: 'EUR',
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone || null,
      },
      distance_km: exp.distance_meters ? exp.distance_meters / 1000 : null,
      isSelected: false,
      nextSession: null,
    }
  })
}

/**
 * Fetch the next available session for each experience (batch).
 * Returns a map of experienceId -> { date, time }.
 */
export async function getNextSessions(
  experienceIds: string[]
): Promise<Map<string, { date: string; time: string }>> {
  if (experienceIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('experience_sessions')
    .select('experience_id, session_date, start_time')
    .in('experience_id', experienceIds)
    .eq('session_status', 'available')
    .gte('session_date', today)
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })

  const result = new Map<string, { date: string; time: string }>()
  for (const row of (data || []) as any[]) {
    if (!result.has(row.experience_id)) {
      result.set(row.experience_id, {
        date: row.session_date,
        time: row.start_time,
      })
    }
  }
  return result
}
