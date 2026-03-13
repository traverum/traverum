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
}

/**
 * Fetch experiences the hotel has selected (active distributions)
 */
export async function getSelectedExperiences(hotelConfigId: string): Promise<ReceptionistExperience[]> {
  const supabase = createAdminClient()

  const { data: distributionsData, error } = await (supabase
    .from('distributions') as any)
    .select(`
      *,
      experience:experiences!distributions_experience_fk (
        *,
        supplier:partners!experiences_partner_fk (
          id, name, email, phone
        )
      )
    `)
    .eq('hotel_config_id', hotelConfigId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error || !distributionsData) return []

  const distributions = distributionsData as any[]

  const experienceIds = distributions.map(d => d.experience?.id).filter(Boolean)

  const { data: mediaList } = await supabase
    .from('media')
    .select('*')
    .in('experience_id', experienceIds)
    .order('sort_order', { ascending: true })

  const mediaData = (mediaList || []) as any[]

  return distributions
    .filter(d => d.experience && d.experience.experience_status === 'active')
    .map(d => {
      const exp = d.experience
      const expMedia = mediaData.filter((m: any) => m.experience_id === exp.id)
      return {
        id: exp.id,
        title: exp.title,
        slug: exp.slug,
        description: exp.description,
        image_url: exp.image_url,
        coverImage: expMedia[0]?.url || exp.image_url || null,
        price_cents: exp.price_cents,
        pricing_type: exp.pricing_type,
        base_price_cents: exp.base_price_cents,
        extra_person_cents: exp.extra_person_cents,
        included_participants: exp.included_participants,
        price_per_day_cents: exp.price_per_day_cents,
        min_days: exp.min_days,
        max_days: exp.max_days,
        duration_minutes: exp.duration_minutes,
        min_participants: exp.min_participants,
        max_participants: exp.max_participants,
        meeting_point: exp.meeting_point,
        location_address: exp.location_address,
        location: exp.location,
        tags: exp.tags || [],
        cancellation_policy: exp.cancellation_policy,
        available_languages: exp.available_languages || [],
        allows_requests: exp.allows_requests,
        hotel_notes: exp.hotel_notes || null,
        currency: exp.currency,
        supplier: {
          id: exp.supplier.id,
          name: exp.supplier.name,
          email: exp.supplier.email,
          phone: exp.supplier.phone || null,
        },
        distance_km: null,
        isSelected: true,
      }
    })
}

/**
 * Fetch all active experiences within the hotel's radius using PostGIS RPC
 */
export async function getNearbyExperiences(hotelConfig: HotelConfig): Promise<ReceptionistExperience[]> {
  const supabase = createAdminClient()

  // Hotel must have location set
  const config = hotelConfig as any
  if (!config.location) return []

  // Parse location - could be WKT or GeoJSON depending on how it's stored
  let lat: number | null = null
  let lng: number | null = null

  if (typeof config.location === 'string') {
    const match = config.location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
    if (match) {
      lng = parseFloat(match[1])
      lat = parseFloat(match[2])
    }
  } else if (config.location && typeof config.location === 'object') {
    const loc = config.location as any
    if (loc.coordinates) {
      lng = loc.coordinates[0]
      lat = loc.coordinates[1]
    }
  }

  if (lat === null || lng === null) return []

  const radiusKm = config.location_radius_km || 25
  const radiusMeters = radiusKm * 1000
  const locationWkt = `POINT(${lng} ${lat})`

  const { data, error } = await (supabase as any).rpc('get_experiences_within_radius', {
    hotel_location: locationWkt,
    radius_meters: radiusMeters,
  })

  if (error || !data) return []

  const experiences = data as any[]

  // Fetch supplier contact info for each unique supplier
  const supplierIds = Array.from(new Set(experiences.map((e: any) => e.supplier_id))) as string[]
  const { data: suppliersData } = await supabase
    .from('partners')
    .select('id, name, email, phone')
    .in('id', supplierIds)

  const suppliersMap = new Map(
    ((suppliersData || []) as any[]).map(s => [s.id, s])
  )

  return experiences.map(exp => {
    const supplier = suppliersMap.get(exp.supplier_id) || {
      id: exp.supplier_id,
      name: exp.supplier_name,
      email: '',
      phone: null,
    }

    return {
      id: exp.id,
      title: exp.title,
      slug: exp.slug,
      description: exp.description || '',
      image_url: exp.image_url,
      coverImage: exp.image_url || null,
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
    }
  })
}
