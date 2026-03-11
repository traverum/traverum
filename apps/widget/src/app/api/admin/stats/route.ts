import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminAccess(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const supabase = createAdminClient()

  const [
    { count: partnerCount },
    { data: experiencePartnerIds },
    { data: hotelConfigPartnerIds },
    { data: pendingPayouts },
    { count: totalBookings },
    { count: completedBookings },
  ] = await Promise.all([
    supabase.from('partners').select('*', { count: 'exact', head: true }),
    supabase.from('experiences').select('partner_id'),
    supabase.from('hotel_configs').select('partner_id'),
    supabase.from('hotel_payouts').select('amount_cents').eq('status', 'pending') as Promise<{ data: { amount_cents: number }[] | null }>,
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_status', 'completed'),
  ])

  const supplierCount = new Set((experiencePartnerIds || []).map((r: { partner_id: string }) => r.partner_id)).size
  const hotelCount = new Set((hotelConfigPartnerIds || []).map((r: { partner_id: string }) => r.partner_id)).size
  const pendingPayoutsCents = (pendingPayouts || []).reduce((sum: number, p: { amount_cents: number }) => sum + (p.amount_cents || 0), 0)

  return jsonResponse({
    partnerCount: partnerCount ?? 0,
    supplierCount,
    hotelCount,
    pendingPayoutsCents,
    pendingPayoutsCount: (pendingPayouts || []).length,
    totalBookings: totalBookings ?? 0,
    completedBookings: completedBookings ?? 0,
  })
}
