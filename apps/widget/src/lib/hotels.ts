import { createAdminClient } from './supabase/server'
import { SELF_OWNED_COMMISSION } from '@traverum/shared'
import type { HotelConfig, Experience, Distribution, Media } from './supabase/types'

export interface HotelWithExperiences {
  hotel: HotelConfig
  partner: {
    id: string
    name: string
    email: string
  }
  experiences: ExperienceWithMedia[]
}

export type ExperienceWithMedia = Experience & {
  media: Media[]
  coverImage: string | null
  supplier: {
    id: string
    name: string
    email: string
    stripe_account_id: string | null
    stripe_onboarding_complete: boolean | null
    payment_mode: 'stripe' | 'pay_on_site'
    display_name: string | null
    avatar_url: string | null
    partner_slug: string | null
    profile_visible: boolean | null
  }
  distribution: Distribution
}

/**
 * Fetch hotel config by slug
 */
export async function getHotelBySlug(slug: string): Promise<HotelConfig | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('hotel_configs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

/**
 * Fetch hotel with all its distributed experiences
 */
export async function getHotelWithExperiences(slug: string): Promise<HotelWithExperiences | null> {
  const supabase = createAdminClient()
  
  // Fetch hotel config
  const { data: hotelData, error: hotelError } = await supabase
    .from('hotel_configs')
    .select(`
      *,
      partner:partners!hotel_configs_partner_fk (
        id,
        name,
        email
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (hotelError || !hotelData) {
    return null
  }

  const hotel = hotelData as any

  // Fetch distributions for this hotel config with experiences
  // Scope by hotel_config_id for multi-property support
  const distSelect = `
    *,
    experience:experiences!distributions_experience_fk (
      *,
      supplier:partners!experiences_partner_fk (
        id,
        name,
        email,
        stripe_account_id,
        stripe_onboarding_complete,
        payment_mode,
        display_name,
        avatar_url,
        partner_slug,
        profile_visible
      )
    )
  `

  let { data: distributionsData, error: distError } = await (supabase
    .from('distributions') as any)
    .select(distSelect)
    .eq('hotel_config_id', hotel.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fallback: sort_order may not exist on older schemas (e.g. staging)
  if (distError?.code === '42703') {
    ;({ data: distributionsData, error: distError } = await (supabase
      .from('distributions') as any)
      .select(distSelect)
      .eq('hotel_config_id', hotel.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }))
  }

  if (distError || !distributionsData) {
    return null
  }

  const distributions = distributionsData as any[]

  // Fetch media for all experiences
  const experienceIds = distributions.map(d => d.experience?.id).filter(Boolean)
  
  const { data: mediaList } = await supabase
    .from('media')
    .select('*')
    .in('experience_id', experienceIds)
    .order('sort_order', { ascending: true })
  
  const mediaData = (mediaList || []) as any[]
  
  // Build experiences with media
  const experiences: ExperienceWithMedia[] = distributions
    .filter(d => d.experience && d.experience.experience_status === 'active')
    .map(d => {
      const exp = d.experience
      const expMedia = mediaData.filter(m => m.experience_id === exp.id)
      
      return {
        ...exp,
        media: expMedia,
        coverImage: expMedia[0]?.url || exp.image_url || null,
        supplier: exp.supplier,
        distribution: {
          id: d.id,
          hotel_id: d.hotel_id,
          experience_id: d.experience_id,
          commission_supplier: d.commission_supplier,
          commission_hotel: d.commission_hotel,
          commission_platform: d.commission_platform,
          is_active: d.is_active,
          created_at: d.created_at,
        },
      }
    })

  return {
    hotel,
    partner: hotel.partner as any,
    experiences,
  }
}

/**
 * Fetch a specific experience for a hotel
 */
export async function getExperienceForHotel(
  hotelSlug: string,
  experienceSlug: string
): Promise<ExperienceWithMedia | null> {
  const supabase = createAdminClient()
  
  // First get the hotel
  const { data: hotelData } = await supabase
    .from('hotel_configs')
    .select('id, partner_id')
    .eq('slug', hotelSlug)
    .eq('is_active', true)
    .single()
  
  if (!hotelData) return null
  
  const hotel = hotelData as any

  // Get all distributions for this hotel config and find the one with matching experience slug
  // Scope by hotel_config_id for multi-property support
  const { data: allDistData } = await (supabase
    .from('distributions') as any)
    .select(`
      *,
      experience:experiences!distributions_experience_fk (
        *,
        supplier:partners!experiences_partner_fk (
          id,
          name,
          email,
          stripe_account_id,
          stripe_onboarding_complete,
          payment_mode,
          display_name,
          avatar_url,
          partner_slug,
          profile_visible
        )
      )
    `)
    .eq('hotel_config_id', hotel.id)
    .eq('is_active', true)

  if (!allDistData || allDistData.length === 0) return null
  
  const allDist = (allDistData || []) as any[]
  const found = allDist.find(d => d.experience?.slug === experienceSlug)
  
  if (!found || !found.experience) return null
  
  const foundExp = found.experience
  
  // Get media for this experience
  const { data: mediaData } = await supabase
    .from('media')
    .select('*')
    .eq('experience_id', foundExp.id)
    .order('sort_order', { ascending: true })
  
  const media = (mediaData || []) as any[]
  
  return {
    ...foundExp,
    media,
    coverImage: media[0]?.url || foundExp.image_url || null,
    supplier: foundExp.supplier,
    distribution: {
      id: found.id,
      hotel_id: found.hotel_id,
      experience_id: found.experience_id,
      commission_supplier: found.commission_supplier,
      commission_hotel: found.commission_hotel,
      commission_platform: found.commission_platform,
      is_active: found.is_active,
      created_at: found.created_at,
    },
  }
}

const DIRECT_DISTRIBUTION: Distribution = {
  id: 'direct',
  hotel_id: '',
  hotel_config_id: null,
  experience_id: '',
  commission_supplier: SELF_OWNED_COMMISSION.supplier,
  commission_hotel: SELF_OWNED_COMMISSION.hotel,
  commission_platform: SELF_OWNED_COMMISSION.platform,
  is_active: true,
  selected_for_widget: true,
  sort_order: 0,
  created_at: null,
}

/**
 * Fetch all active experiences for direct (Veyond) booking
 */
export async function getAllActiveExperiences(): Promise<ExperienceWithMedia[]> {
  const supabase = createAdminClient()

  const { data: experiencesData, error } = await supabase
    .from('experiences')
    .select(`
      *,
      supplier:partners!experiences_partner_fk (
        id, name, email, stripe_account_id, stripe_onboarding_complete, payment_mode,
        display_name, avatar_url, partner_slug, profile_visible
      )
    `)
    .eq('experience_status', 'active')
    .order('created_at', { ascending: false })

  if (error || !experiencesData) return []

  const experiences = experiencesData as any[]
  const experienceIds = experiences.map(e => e.id)

  if (experienceIds.length === 0) return []

  const { data: mediaList } = await supabase
    .from('media')
    .select('*')
    .in('experience_id', experienceIds)
    .order('sort_order', { ascending: true })

  const mediaData = (mediaList || []) as any[]

  return experiences.map(exp => {
    const expMedia = mediaData.filter(m => m.experience_id === exp.id)
    return {
      ...exp,
      media: expMedia,
      coverImage: expMedia[0]?.url || exp.image_url || null,
      supplier: exp.supplier,
      distribution: { ...DIRECT_DISTRIBUTION, experience_id: exp.id },
    }
  })
}

/**
 * Fetch a single experience by slug for direct (Veyond) booking
 */
export async function getExperienceDirect(
  experienceSlug: string
): Promise<ExperienceWithMedia | null> {
  const supabase = createAdminClient()

  const { data: expData } = await supabase
    .from('experiences')
    .select(`
      *,
      supplier:partners!experiences_partner_fk (
        id, name, email, stripe_account_id, stripe_onboarding_complete, payment_mode,
        display_name, avatar_url, partner_slug, profile_visible
      )
    `)
    .eq('slug', experienceSlug)
    .eq('experience_status', 'active')
    .single()

  if (!expData) return null

  const exp = expData as any

  const { data: mediaData } = await supabase
    .from('media')
    .select('*')
    .eq('experience_id', exp.id)
    .order('sort_order', { ascending: true })

  const media = (mediaData || []) as any[]

  return {
    ...exp,
    media,
    coverImage: media[0]?.url || exp.image_url || null,
    supplier: exp.supplier,
    distribution: { ...DIRECT_DISTRIBUTION, experience_id: exp.id },
  }
}

// ---------------------------------------------------------------------------
// Session calendar (for listing-page availability filters)
// ---------------------------------------------------------------------------

export interface SessionCalendarEntry {
  experience_id: string
  session_date: string
  start_time: string
  spots_available: number
}

/**
 * Fetch lightweight session data for availability filtering on listing pages.
 * Only returns future sessions that are available (not cancelled/full).
 */
export async function getSessionCalendar(
  experienceIds: string[]
): Promise<SessionCalendarEntry[]> {
  if (experienceIds.length === 0) return []

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('experience_sessions')
    .select('experience_id, session_date, start_time, spots_available')
    .in('experience_id', experienceIds)
    .eq('session_status', 'available')
    .gte('session_date', today)
    .gt('spots_available', 0)
    .order('session_date', { ascending: true })

  if (error || !data) return []

  return data as SessionCalendarEntry[]
}

// ---------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------

export interface HostProfile {
  id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  partner_slug: string
  city: string | null
  country: string | null
}

export interface HostWithExperiences extends HostProfile {
  experiences: ExperienceWithMedia[]
}

/**
 * Fetch all partners with profile_visible = true that have active experiences.
 * When hotelConfigId is set (hotel channel), scope to partners distributed to that hotel.
 * When null (Veyond direct), return all visible hosts.
 */
export async function getVisibleHosts(
  hotelConfigId: string | null
): Promise<HostProfile[]> {
  const supabase = createAdminClient()

  if (hotelConfigId) {
    // Hotel channel: only partners whose experiences are distributed to this hotel
    const { data: distData } = await (supabase
      .from('distributions') as any)
      .select(`
        experience:experiences!distributions_experience_fk (
          partner_id,
          experience_status
        )
      `)
      .eq('hotel_config_id', hotelConfigId)
      .eq('is_active', true)

    if (!distData || distData.length === 0) return []

    const partnerIds = Array.from(new Set(
      (distData as any[])
        .filter(d => d.experience?.experience_status === 'active')
        .map(d => d.experience.partner_id)
        .filter(Boolean) as string[]
    ))

    if (partnerIds.length === 0) return []

    const { data: partners } = await supabase
      .from('partners')
      .select('id, display_name, bio, avatar_url, partner_slug, city, country')
      .eq('profile_visible', true)
      .in('id', partnerIds)

    if (!partners) return []

    return (partners as any[])
      .filter(p => p.display_name && p.partner_slug)
      .map(p => ({
        id: p.id,
        display_name: p.display_name!,
        bio: p.bio,
        avatar_url: p.avatar_url,
        partner_slug: p.partner_slug!,
        city: p.city,
        country: p.country,
      }))
  }

  // Veyond direct: all visible hosts with at least one active experience
  const { data: partners } = await supabase
    .from('partners')
    .select('id, display_name, bio, avatar_url, partner_slug, city, country')
    .eq('profile_visible', true)

  if (!partners || partners.length === 0) return []

  const visiblePartners = (partners as any[]).filter(
    p => p.display_name && p.partner_slug
  )

  if (visiblePartners.length === 0) return []

  // Verify each has at least one active experience
  const { data: expCounts } = await supabase
    .from('experiences')
    .select('partner_id')
    .eq('experience_status', 'active')
    .in(
      'partner_id',
      visiblePartners.map(p => p.id)
    )

  const activePartnerIds = new Set(
    (expCounts || []).map((e: any) => e.partner_id)
  )

  return visiblePartners
    .filter(p => activePartnerIds.has(p.id))
    .map(p => ({
      id: p.id,
      display_name: p.display_name!,
      bio: p.bio,
      avatar_url: p.avatar_url,
      partner_slug: p.partner_slug!,
      city: p.city,
      country: p.country,
    }))
}

/**
 * Fetch a single host profile by slug with their active experiences.
 * Scoped by channel: hotelConfigId = null for Veyond direct, set for hotel widget.
 */
export async function getHostBySlug(
  hostSlug: string,
  hotelConfigId: string | null
): Promise<HostWithExperiences | null> {
  const supabase = createAdminClient()

  const { data: partnerData } = await (supabase
    .from('partners') as any)
    .select('id, display_name, bio, avatar_url, partner_slug, city, country, profile_visible')
    .eq('partner_slug', hostSlug)
    .eq('profile_visible', true)
    .single() as { data: any }

  if (!partnerData || !partnerData.display_name || !partnerData.partner_slug) {
    return null
  }

  const partner = partnerData as any

  let experiences: ExperienceWithMedia[]

  if (hotelConfigId) {
    // Hotel channel: only experiences distributed to this hotel
    const { data: distData } = await (supabase
      .from('distributions') as any)
      .select(`
        *,
        experience:experiences!distributions_experience_fk (
          *,
          supplier:partners!experiences_partner_fk (
            id, name, email, stripe_account_id, stripe_onboarding_complete, payment_mode,
            display_name, avatar_url, partner_slug, profile_visible
          )
        )
      `)
      .eq('hotel_config_id', hotelConfigId)
      .eq('is_active', true)

    const dists = ((distData || []) as any[]).filter(
      d =>
        d.experience?.partner_id === partner.id &&
        d.experience?.experience_status === 'active'
    )

    const experienceIds = dists.map(d => d.experience.id)
    const { data: mediaList } = await supabase
      .from('media')
      .select('*')
      .in('experience_id', experienceIds.length > 0 ? experienceIds : ['__none__'])
      .order('sort_order', { ascending: true })

    const mediaData = (mediaList || []) as any[]

    experiences = dists.map(d => {
      const exp = d.experience
      const expMedia = mediaData.filter(m => m.experience_id === exp.id)
      return {
        ...exp,
        media: expMedia,
        coverImage: expMedia[0]?.url || exp.image_url || null,
        supplier: exp.supplier,
        distribution: {
          id: d.id,
          hotel_id: d.hotel_id,
          experience_id: d.experience_id,
          commission_supplier: d.commission_supplier,
          commission_hotel: d.commission_hotel,
          commission_platform: d.commission_platform,
          is_active: d.is_active,
          created_at: d.created_at,
        },
      }
    })
  } else {
    // Veyond direct
    const { data: expData } = await supabase
      .from('experiences')
      .select(`
        *,
        supplier:partners!experiences_partner_fk (
          id, name, email, stripe_account_id, stripe_onboarding_complete, payment_mode,
          display_name, avatar_url, partner_slug, profile_visible
        )
      `)
      .eq('partner_id', partner.id)
      .eq('experience_status', 'active')
      .order('created_at', { ascending: false })

    const exps = (expData || []) as any[]
    const experienceIds = exps.map(e => e.id)

    const { data: mediaList } = await supabase
      .from('media')
      .select('*')
      .in('experience_id', experienceIds.length > 0 ? experienceIds : ['__none__'])
      .order('sort_order', { ascending: true })

    const mediaData = (mediaList || []) as any[]

    experiences = exps.map(exp => {
      const expMedia = mediaData.filter(m => m.experience_id === exp.id)
      return {
        ...exp,
        media: expMedia,
        coverImage: expMedia[0]?.url || exp.image_url || null,
        supplier: exp.supplier,
        distribution: { ...DIRECT_DISTRIBUTION, experience_id: exp.id },
      }
    })
  }

  return {
    id: partner.id,
    display_name: partner.display_name,
    bio: partner.bio,
    avatar_url: partner.avatar_url,
    partner_slug: partner.partner_slug,
    city: partner.city,
    country: partner.country,
    experiences,
  }
}
