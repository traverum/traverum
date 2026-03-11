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
  const { searchParams } = new URL(request.url)
  const bookingStatus = searchParams.get('status')
  const linked = searchParams.get('linked')
  const paidFrom = searchParams.get('paidFrom')
  const paidTo = searchParams.get('paidTo')
  const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)

  const supabase = createAdminClient()

  let query = (supabase
    .from('bookings')
    .select(`
      id,
      amount_cents,
      supplier_amount_cents,
      hotel_amount_cents,
      platform_amount_cents,
      hotel_payout_id,
      booking_status,
      paid_at,
      stripe_charge_id,
      stripe_payment_intent_id,
      stripe_transfer_id,
      stripe_refund_id,
      reservation:reservations!inner(
        hotel_id,
        requested_date,
        experience:experiences(id, title),
        session:experience_sessions(session_date, start_time)
      ),
      payout:hotel_payouts(
        id,
        status,
        payment_ref,
        paid_at,
        period_start,
        period_end
      )
    `)
    .eq('reservation.hotel_id', partnerId)
    .order('paid_at', { ascending: false })
    .limit(limit) as any)

  if (bookingStatus) query = query.eq('booking_status', bookingStatus)
  if (linked === 'linked') query = query.not('hotel_payout_id', 'is', null)
  if (linked === 'unlinked') query = query.is('hotel_payout_id', null)
  if (paidFrom) query = query.gte('paid_at', paidFrom)
  if (paidTo) query = query.lte('paid_at', paidTo)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching payment log:', error)
    return jsonResponse({ error: 'Database error' }, 500)
  }

  const rows = (data || []).map((row: any) => {
    const total = row.amount_cents || 0
    const splitTotal =
      (row.supplier_amount_cents || 0) +
      (row.hotel_amount_cents || 0) +
      (row.platform_amount_cents || 0)

    return {
      ...row,
      split_total_cents: splitTotal,
      split_matches_total: total === splitTotal,
    }
  })

  return jsonResponse({
    rows,
    count: rows.length,
    limit,
  })
}
