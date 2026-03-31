import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { HotelConfig, Partner, User } from '@/lib/supabase/types'

const PROPERTY_COOKIE = 'traverum_receptionist_property'

export type AvailableHotelConfig = { id: string; slug: string; display_name: string }

export type ReceptionistContext = {
  user: User
  partner: Partner
  hotelConfig: HotelConfig
  role: string
  userId: string
  availableHotelConfigs: AvailableHotelConfig[]
}

export type ReceptionistAuthResult =
  | { success: true; data: ReceptionistContext }
  | { success: false; error: 'not_authenticated' | 'no_user_record' | 'not_receptionist' | 'no_hotel_config' }

const ALLOWED_ROLES = ['receptionist', 'owner', 'admin']

/**
 * Resolve the receptionist context from the authenticated session.
 * Uses user_partners (not legacy users.partner_id) to support role-based access.
 * Owners and admins can also use the receptionist tool.
 *
 * When a membership has hotel_config_id set, the user is locked to that property.
 * When hotel_config_id is null (owners, multi-property receptionists), all
 * hotel_configs for the partner are available and the user can switch between
 * them via a cookie-based property selector.
 */
export async function getReceptionistContext(): Promise<ReceptionistAuthResult> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'not_authenticated' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single() as { data: { id: string; auth_id: string; email: string; partner_id: string | null; created_at: string | null; updated_at: string | null } | null }

  if (!userData) {
    return { success: false, error: 'no_user_record' }
  }

  const user = userData as unknown as User

  const { data: memberships } = await supabase
    .from('user_partners')
    .select('partner_id, role, hotel_config_id')
    .eq('user_id', userData.id)
    .in('role', ALLOWED_ROLES) as {
    data: { partner_id: string; role: string; hotel_config_id: string | null }[] | null
  }

  if (!memberships?.length) {
    return { success: false, error: 'not_receptionist' }
  }

  const membershipRank = (m: { role: string; hotel_config_id: string | null }) => {
    if (m.role === 'receptionist') return 0
    if (m.hotel_config_id) return 1
    return 2
  }

  const sortedMemberships = [...memberships].sort(
    (a, b) => membershipRank(a) - membershipRank(b),
  )

  const cookieStore = await cookies()
  const preferredPropertyId = cookieStore.get(PROPERTY_COOKIE)?.value ?? null

  for (const membership of sortedMemberships) {
    const { data: partnerData } = await supabase
      .from('partners')
      .select('*')
      .eq('id', membership.partner_id)
      .single()

    if (!partnerData) {
      continue
    }

    const partner = partnerData as Partner

    if (membership.hotel_config_id) {
      // Locked to a specific property
      const { data: hotelConfigData } = await supabase
        .from('hotel_configs')
        .select('*')
        .eq('id', membership.hotel_config_id)
        .maybeSingle()

      if (!hotelConfigData) continue

      const hotelConfig = hotelConfigData as HotelConfig
      return {
        success: true,
        data: {
          user,
          partner,
          hotelConfig,
          role: membership.role,
          userId: userData.id,
          availableHotelConfigs: [{ id: hotelConfig.id, slug: hotelConfig.slug, display_name: hotelConfig.display_name }],
        },
      }
    }

    // No hotel_config_id — fetch all configs for this partner
    const { data: allConfigs } = await supabase
      .from('hotel_configs')
      .select('*')
      .eq('partner_id', membership.partner_id)
      .order('created_at', { ascending: true })

    if (!allConfigs?.length) continue

    const availableHotelConfigs: AvailableHotelConfig[] = allConfigs.map(c => ({
      id: c.id,
      slug: c.slug,
      display_name: c.display_name,
    }))

    const selectedConfig = (
      preferredPropertyId
        ? allConfigs.find(c => c.id === preferredPropertyId)
        : null
    ) ?? allConfigs[0]

    const hotelConfig = selectedConfig as HotelConfig

    return {
      success: true,
      data: {
        user,
        partner,
        hotelConfig,
        role: membership.role,
        userId: userData.id,
        availableHotelConfigs,
      },
    }
  }

  return { success: false, error: 'no_hotel_config' }
}
