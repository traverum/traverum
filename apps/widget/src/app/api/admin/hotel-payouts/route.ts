import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * POST — Create a hotel payout for a date range.
 * Finds all completed bookings within the period that haven't been assigned
 * to a payout yet, sums hotel_amount_cents, creates a payout record,
 * and links the bookings.
 */
export async function POST(request: NextRequest) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const body = await request.json()
  const { partnerId, periodStart, periodEnd, currency = 'EUR' } = body

  if (!partnerId || !periodStart || !periodEnd) {
    return jsonResponse(
      { error: 'partnerId, periodStart, and periodEnd are required' },
      400
    )
  }

  const supabase = createAdminClient()

  const { data: bookings, error: fetchErr } = await supabase
    .from('bookings')
    .select(`
      id,
      hotel_amount_cents,
      reservation:reservations!inner(
        hotel_id,
        requested_date,
        session:experience_sessions(session_date)
      )
    `)
    .eq('booking_status', 'completed')
    .is('hotel_payout_id', null)
    .eq('reservation.hotel_id', partnerId) as any

  if (fetchErr) {
    console.error('Error fetching bookings for payout:', fetchErr)
    return jsonResponse({ error: 'Database error' }, 500)
  }

  const eligible = (bookings || []).filter((b: any) => {
    const reservation = b.reservation
    const experienceDate =
      reservation?.session?.session_date || reservation?.requested_date
    return (
      experienceDate &&
      experienceDate >= periodStart &&
      experienceDate <= periodEnd
    )
  })

  if (eligible.length === 0) {
    return jsonResponse(
      { error: 'No unpaid completed bookings found in this period' },
      404
    )
  }

  const amountCents = eligible.reduce(
    (sum: number, b: any) => sum + (b.hotel_amount_cents || 0),
    0
  )

  const { data: payout, error: insertErr } = await (supabase
    .from('hotel_payouts') as any)
    .insert({
      partner_id: partnerId,
      period_start: periodStart,
      period_end: periodEnd,
      amount_cents: amountCents,
      currency,
      status: 'pending',
      created_by: 'admin',
    })
    .select()
    .single()

  if (insertErr || !payout) {
    console.error('Error creating payout:', insertErr)
    return jsonResponse({ error: 'Failed to create payout' }, 500)
  }

  const bookingIds = eligible.map((b: any) => b.id)
  const { error: updateErr } = await (supabase.from('bookings') as any)
    .update({ hotel_payout_id: payout.id, updated_at: new Date().toISOString() })
    .in('id', bookingIds)

  if (updateErr) {
    console.error('Error linking bookings to payout:', updateErr)
    return jsonResponse({ error: 'Payout created but failed to link bookings' }, 500)
  }

  return jsonResponse({
    payout,
    bookingCount: eligible.length,
    amountCents,
  })
}

/**
 * GET — List hotel payouts, optionally filtered by partner.
 * Query params: ?partnerId=xxx
 */
export async function GET(request: NextRequest) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { searchParams } = new URL(request.url)
  const partnerId = searchParams.get('partnerId')

  const supabase = createAdminClient()

  let query = supabase
    .from('hotel_payouts')
    .select('*')
    .order('created_at', { ascending: false })

  if (partnerId) {
    query = query.eq('partner_id', partnerId)
  }

  const { data: payouts, error } = await query

  if (error) {
    console.error('Error fetching payouts:', error)
    return jsonResponse({ error: 'Database error' }, 500)
  }

  const payoutIds = (payouts || []).map((p: any) => p.id)
  let bookingCounts: Record<string, number> = {}

  if (payoutIds.length > 0) {
    const { data: counts, error: countErr } = await supabase
      .from('bookings')
      .select('hotel_payout_id')
      .in('hotel_payout_id', payoutIds)

    if (!countErr && counts) {
      for (const row of counts) {
        const pid = (row as any).hotel_payout_id
        bookingCounts[pid] = (bookingCounts[pid] || 0) + 1
      }
    }
  }

  const enriched = (payouts || []).map((p: any) => ({
    ...p,
    booking_count: bookingCounts[p.id] || 0,
  }))

  return jsonResponse({ payouts: enriched })
}
