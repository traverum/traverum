import { createClient } from '@/lib/supabase/server'
import type { HotelConfig, Partner, User } from '@/lib/supabase/types'

export type HotelContext = {
  user: User
  partner: Partner
  hotelConfig: HotelConfig
}

export type AuthResult = 
  | { success: true; data: HotelContext }
  | { success: false; error: 'not_authenticated' | 'no_user_record' | 'no_hotel_config' }

/**
 * Get the current hotel context from the authenticated session.
 * This fetches the user record, partner, and hotel config in sequence.
 */
export async function getHotelContext(): Promise<AuthResult> {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return { success: false, error: 'not_authenticated' }
  }

  // Fetch user record by auth_id
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single()

  if (!userData) {
    return { success: false, error: 'no_user_record' }
  }

  const user = userData as User

  // Fetch partner (hotel)
  const { data: partnerData } = await supabase
    .from('partners')
    .select('*')
    .eq('id', user.partner_id)
    .single()

  if (!partnerData) {
    return { success: false, error: 'no_user_record' }
  }

  const partner = partnerData as Partner

  // Fetch hotel config
  const { data: hotelConfigData } = await supabase
    .from('hotel_configs')
    .select('*')
    .eq('partner_id', user.partner_id)
    .single()

  if (!hotelConfigData) {
    return { success: false, error: 'no_hotel_config' }
  }

  const hotelConfig = hotelConfigData as HotelConfig

  return {
    success: true,
    data: { user, partner, hotelConfig }
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
