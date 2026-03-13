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

  // Find user_partners membership with an allowed role
  const { data: membership } = await supabase
    .from('user_partners')
    .select('partner_id, role, hotel_config_id')
    .eq('user_id', userData.id)
    .in('role', ALLOWED_ROLES)
    .limit(1)
    .single() as { data: { partner_id: string; role: string; hotel_config_id: string | null } | null }

  if (!membership) {
    return { success: false, error: 'not_receptionist' }
  }

  // Fetch partner
  const { data: partnerData } = await supabase
    .from('partners')
    .select('*')
    .eq('id', membership.partner_id)
    .single()

  if (!partnerData) {
    return { success: false, error: 'no_user_record' }
  }

  const partner = partnerData as Partner

  // Fetch hotel config — use the specific hotel_config_id if set, otherwise first config for partner
  let hotelConfigQuery = supabase
    .from('hotel_configs')
    .select('*')

  if (membership.hotel_config_id) {
    hotelConfigQuery = hotelConfigQuery.eq('id', membership.hotel_config_id)
  } else {
    hotelConfigQuery = hotelConfigQuery.eq('partner_id', membership.partner_id)
  }

  const { data: hotelConfigData } = await hotelConfigQuery.limit(1).single()

  if (!hotelConfigData) {
    return { success: false, error: 'no_hotel_config' }
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
