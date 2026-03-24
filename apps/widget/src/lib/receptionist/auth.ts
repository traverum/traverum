import { createClient } from '@/lib/supabase/server'
import type { HotelConfig, Partner, User } from '@/lib/supabase/types'

export type ReceptionistContext = {
  user: User
  partner: Partner
  hotelConfig: HotelConfig
  role: string
  userId: string
}

export type ReceptionistAuthResult =
  | { success: true; data: ReceptionistContext }
  | { success: false; error: 'not_authenticated' | 'no_user_record' | 'not_receptionist' | 'no_hotel_config' }

const ALLOWED_ROLES = ['receptionist', 'owner', 'admin']

/**
 * Resolve the receptionist context from the authenticated session.
 * Uses user_partners (not legacy users.partner_id) to support role-based access.
 * Owners and admins can also use the receptionist tool.
 */
export async function getReceptionistContext(): Promise<ReceptionistAuthResult> {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return { success: false, error: 'not_authenticated' }
  }

  // Resolve app user by auth_id
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single() as { data: { id: string; auth_id: string; email: string; partner_id: string | null; created_at: string | null; updated_at: string | null } | null }

  if (!userData) {
    return { success: false, error: 'no_user_record' }
  }

  const user = userData as unknown as User

  // All memberships with an allowed role (users may belong to supplier + hotel partners).
  // Pick the first membership that resolves to a hotel_configs row — never rely on .limit(1)
  // without ordering, or supplier-only rows block receptionist access.
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

    let hotelConfigQuery = supabase.from('hotel_configs').select('*')

    if (membership.hotel_config_id) {
      hotelConfigQuery = hotelConfigQuery.eq('id', membership.hotel_config_id)
    } else {
      hotelConfigQuery = hotelConfigQuery.eq('partner_id', membership.partner_id)
    }

    const { data: hotelConfigData } = await hotelConfigQuery.limit(1).maybeSingle()

    if (!hotelConfigData) {
      continue
    }

    const hotelConfig = hotelConfigData as HotelConfig

    return {
      success: true,
      data: {
        user,
        partner,
        hotelConfig,
        role: membership.role,
        userId: userData.id,
      },
    }
  }

  return { success: false, error: 'no_hotel_config' }
}
