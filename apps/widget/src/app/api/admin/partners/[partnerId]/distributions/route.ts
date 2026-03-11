import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * GET — List all distributions for this hotel partner (active and inactive).
 * Used by admin to view and edit commission rates per experience per property.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { partnerId } = await params
  const supabase = createAdminClient()

  const { data: distributions, error } = await (supabase
    .from('distributions')
    .select(`
      id,
      experience_id,
      hotel_config_id,
      hotel_id,
      commission_supplier,
      commission_hotel,
      commission_platform,
      is_active,
      sort_order,
      experience:experiences!distributions_experience_fk(id, title, partner_id),
      hotel_config:hotel_configs!distributions_hotel_config_id_fkey(id, display_name, slug)
    `)
    .eq('hotel_id', partnerId)
    .order('sort_order', { ascending: true, nullsFirst: false }) as any)

  if (error) {
    console.error('Error fetching distributions:', error)
    return jsonResponse({ error: 'Database error', details: error.message }, 500)
  }

  const rows = (distributions || []).map((d: any) => {
    const exp = d.experience ?? d.experiences
    const config = d.hotel_config ?? d.hotel_configs
    return {
      id: d.id,
      experienceId: d.experience_id,
      experienceTitle: exp?.title ?? 'Unknown experience',
      experiencePartnerId: exp?.partner_id ?? null,
      hotelConfigId: d.hotel_config_id,
      hotelConfigName: config?.display_name ?? config?.slug ?? 'Default',
      hotelId: d.hotel_id,
      commissionSupplier: d.commission_supplier,
      commissionHotel: d.commission_hotel,
      commissionPlatform: d.commission_platform,
      isActive: d.is_active ?? true,
      sortOrder: d.sort_order,
    }
  })

  return jsonResponse({ distributions: rows })
}
