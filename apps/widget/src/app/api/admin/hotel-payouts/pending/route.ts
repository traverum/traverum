import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess } from '@/app/api/admin/_lib/verifyAdminAccess'

/**
 * GET — Aggregates unpaid hotel commission per hotel per month.
 * Returns completed bookings where hotel_payout_id IS NULL and
 * hotel_amount_cents > 0, grouped by reservation.hotel_id and month.
 */
export async function GET(request: NextRequest) {
  if (!await verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      hotel_amount_cents,
      paid_at,
      reservation:reservations!inner(
        hotel_id,
        requested_date,
        session:experience_sessions(session_date)
      )
    `)
    .eq('booking_status', 'completed')
    .is('hotel_payout_id', null)
    .gt('hotel_amount_cents', 0) as any

  if (error) {
    console.error('Error fetching pending hotel commission:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const hotelIds = new Set<string>()
  for (const b of bookings || []) {
    const hotelId = b.reservation?.hotel_id
    if (hotelId) hotelIds.add(hotelId)
  }

  let partnerMap = new Map<string, string>()
  if (hotelIds.size > 0) {
    const { data: partners } = await supabase
      .from('partners')
      .select('id, name')
      .in('id', Array.from(hotelIds))

    for (const p of partners || []) {
      partnerMap.set((p as any).id, (p as any).name)
    }
  }

  // month key: YYYY-MM derived from experience date (session_date > requested_date > paid_at)
  interface PendingGroup {
    hotelId: string
    hotelName: string
    month: string
    monthLabel: string
    amountCents: number
    bookingCount: number
    periodStart: string
    periodEnd: string
  }

  const groupMap = new Map<string, PendingGroup>()

  for (const b of bookings || []) {
    const reservation = b.reservation
    const hotelId = reservation?.hotel_id
    if (!hotelId) continue

    const experienceDate =
      reservation?.session?.session_date ||
      reservation?.requested_date ||
      b.paid_at?.slice(0, 10)
    if (!experienceDate) continue

    const month = experienceDate.slice(0, 7) // YYYY-MM
    const key = `${hotelId}::${month}`

    if (!groupMap.has(key)) {
      const [year, m] = month.split('-')
      const monthDate = new Date(Number(year), Number(m) - 1)
      const monthLabel = monthDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      })
      const lastDay = new Date(Number(year), Number(m), 0).getDate()

      groupMap.set(key, {
        hotelId,
        hotelName: partnerMap.get(hotelId) || 'Unknown',
        month,
        monthLabel,
        amountCents: 0,
        bookingCount: 0,
        periodStart: `${month}-01`,
        periodEnd: `${month}-${String(lastDay).padStart(2, '0')}`,
      })
    }

    const group = groupMap.get(key)!
    group.amountCents += b.hotel_amount_cents || 0
    group.bookingCount += 1
  }

  const pending = Array.from(groupMap.values()).sort((a, b) => {
    const cmp = a.hotelName.localeCompare(b.hotelName)
    if (cmp !== 0) return cmp
    return b.month.localeCompare(a.month)
  })

  const totalOwedCents = pending.reduce((s, g) => s + g.amountCents, 0)
  const totalBookings = pending.reduce((s, g) => s + g.bookingCount, 0)

  return NextResponse.json({
    pending,
    totalOwedCents,
    totalBookings,
  })
}
