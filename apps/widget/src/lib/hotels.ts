import { createAdminClient } from './supabase/server'
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

export interface ExperienceWithMedia extends Experience {
  media: Media[]
  coverImage: string | null
  supplier: {
    id: string
    name: string
    email: string
    stripe_account_id: string | null
    stripe_onboarding_complete: boolean | null
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

  // Fetch distributions for this hotel with experiences
  const { data: distributionsData, error: distError } = await supabase
    .from('distributions')
    .select(`
      *,
      experience:experiences!distributions_experience_fk (
        *,
        supplier:partners!experiences_partner_fk (
          id,
          name,
          email,
          stripe_account_id,
          stripe_onboarding_complete
        )
      )
    `)
    .eq('hotel_id', hotel.partner_id)
    .eq('is_active', true)
  
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
    .select('partner_id')
    .eq('slug', hotelSlug)
    .eq('is_active', true)
    .single()
  
  if (!hotelData) return null
  
  const hotel = hotelData as any

  // Get all distributions for this hotel and find the one with matching experience slug
  const { data: allDistData } = await supabase
    .from('distributions')
    .select(`
      *,
      experience:experiences!distributions_experience_fk (
        *,
        supplier:partners!experiences_partner_fk (
          id,
          name,
          email,
          stripe_account_id,
          stripe_onboarding_complete
        )
      )
    `)
    .eq('hotel_id', hotel.partner_id)
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
