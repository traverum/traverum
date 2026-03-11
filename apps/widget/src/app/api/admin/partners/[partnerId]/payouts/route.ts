import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { partnerId } = await params
  const supabase = createAdminClient()

  const { data: payouts, error } = await supabase
    .from('hotel_payouts')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching partner payouts:', error)
    return jsonResponse({ error: 'Database error' }, 500)
  }

  const payoutIds = (payouts || []).map((p: any) => p.id)
  const bookingCounts: Record<string, number> = {}

  if (payoutIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('hotel_payout_id')
      .in('hotel_payout_id', payoutIds)

    for (const row of bookings || []) {
      const payoutId = (row as any).hotel_payout_id
      bookingCounts[payoutId] = (bookingCounts[payoutId] || 0) + 1
    }
  }

  const enriched = (payouts || []).map((p: any) => ({
    ...p,
    booking_count: bookingCounts[p.id] || 0,
  }))

  return jsonResponse({ payouts: enriched })
}
