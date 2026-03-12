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

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const supabase = createAdminClient()

  // --- Widget views ---
  let viewsQuery = supabase
    .from('analytics_events')
    .select('id, source, hotel_config_id, created_at')
    .eq('event_type', 'widget_view')

  if (from) viewsQuery = viewsQuery.gte('created_at', `${from}T00:00:00Z`)
  if (to) viewsQuery = viewsQuery.lte('created_at', `${to}T23:59:59Z`)

  const { data: viewRows } = await viewsQuery

  const totalWidgetViews = (viewRows || []).length
  const sourceMap = new Map<string, number>()
  const dayMap = new Map<string, number>()
  const hotelViewMap = new Map<string, number>()
  for (const row of viewRows || []) {
    const src = row.source || 'direct'
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
    const day = row.created_at.slice(0, 10)
    dayMap.set(day, (dayMap.get(day) || 0) + 1)
    if (row.hotel_config_id) {
      hotelViewMap.set(row.hotel_config_id, (hotelViewMap.get(row.hotel_config_id) || 0) + 1)
    }
  }

  const viewsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }))
  const viewsByDay = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }))

  // Resolve hotel config names for top hotels
  const topHotelConfigIds = Array.from(hotelViewMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  let hotelNameMap = new Map<string, string>()
  if (topHotelConfigIds.length > 0) {
    const { data: configs } = await supabase
      .from('hotel_configs')
      .select('id, display_name')
      .in('id', topHotelConfigIds)
    for (const c of configs || []) {
      hotelNameMap.set(c.id, c.display_name)
    }
  }

  const topHotelsByViews = Array.from(hotelViewMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([hotelConfigId, views]) => ({
      hotelConfigId,
      name: hotelNameMap.get(hotelConfigId) || 'Unknown',
      views,
    }))

  // --- Booking funnel ---
  let reservationsQuery = supabase
    .from('reservations')
    .select('id, reservation_status, is_request')

  if (from) reservationsQuery = reservationsQuery.gte('created_at', `${from}T00:00:00Z`)
  if (to) reservationsQuery = reservationsQuery.lte('created_at', `${to}T23:59:59Z`)

  const { data: reservationRows } = await reservationsQuery

  const totalReservations = (reservationRows || []).length
  const totalRequests = (reservationRows || []).filter((r: any) => r.is_request).length
  const accepted = (reservationRows || []).filter((r: any) => r.reservation_status === 'approved').length
  const declined = (reservationRows || []).filter((r: any) => r.reservation_status === 'declined').length
  const expired = (reservationRows || []).filter((r: any) => r.reservation_status === 'expired').length

  let bookingsQuery = supabase
    .from('bookings')
    .select('id, amount_cents, booking_status, reservation:reservations!inner(experience_id, hotel_id)') as any

  if (from) bookingsQuery = bookingsQuery.gte('created_at', `${from}T00:00:00Z`)
  if (to) bookingsQuery = bookingsQuery.lte('created_at', `${to}T23:59:59Z`)

  const { data: bookingRows } = await bookingsQuery

  const booked = (bookingRows || []).filter((b: any) => b.booking_status === 'confirmed' || b.booking_status === 'completed').length
  const cancelled = (bookingRows || []).filter((b: any) => b.booking_status === 'cancelled').length

  // --- Transaction performance ---
  const paidBookings = (bookingRows || []).filter((b: any) => b.booking_status === 'confirmed' || b.booking_status === 'completed')
  const totalRevenueCents = paidBookings.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0)
  const averageDealCents = paidBookings.length > 0 ? Math.round(totalRevenueCents / paidBookings.length) : 0

  // Top experiences by bookings
  const expMap = new Map<string, { bookings: number; revenueCents: number }>()
  for (const b of paidBookings) {
    const expId = b.reservation?.experience_id
    if (!expId) continue
    const existing = expMap.get(expId) || { bookings: 0, revenueCents: 0 }
    existing.bookings++
    existing.revenueCents += b.amount_cents || 0
    expMap.set(expId, existing)
  }

  const topExpIds = Array.from(expMap.keys())
  let expTitleMap = new Map<string, string>()
  if (topExpIds.length > 0) {
    const { data: exps } = await supabase.from('experiences').select('id, title').in('id', topExpIds)
    for (const e of exps || []) {
      expTitleMap.set(e.id, e.title)
    }
  }

  const topExperiences = Array.from(expMap.entries())
    .map(([experienceId, data]) => ({
      experienceId,
      title: expTitleMap.get(experienceId) || 'Unknown',
      bookings: data.bookings,
      revenueCents: data.revenueCents,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10)

  // Top hotels by bookings
  const hotelBookingMap = new Map<string, { bookings: number; revenueCents: number }>()
  for (const b of paidBookings) {
    const hId = b.reservation?.hotel_id
    if (!hId) continue
    const existing = hotelBookingMap.get(hId) || { bookings: 0, revenueCents: 0 }
    existing.bookings++
    existing.revenueCents += b.amount_cents || 0
    hotelBookingMap.set(hId, existing)
  }

  const topHotelPartnerIds = Array.from(hotelBookingMap.keys()).slice(0, 10)
  let hotelPartnerNameMap = new Map<string, string>()
  if (topHotelPartnerIds.length > 0) {
    const { data: partners } = await supabase.from('partners').select('id, name').in('id', topHotelPartnerIds)
    for (const p of partners || []) {
      hotelPartnerNameMap.set(p.id, p.name)
    }
  }

  const topHotelsByBookings = Array.from(hotelBookingMap.entries())
    .sort((a, b) => b[1].revenueCents - a[1].revenueCents)
    .slice(0, 10)
    .map(([partnerId, data]) => ({
      partnerId,
      name: hotelPartnerNameMap.get(partnerId) || 'Unknown',
      bookings: data.bookings,
      revenueCents: data.revenueCents,
    }))

  return jsonResponse({
    totalWidgetViews,
    viewsBySource,
    viewsByDay,
    topHotelsByViews,
    totalReservations,
    totalRequests,
    accepted,
    declined,
    expired,
    booked,
    cancelled,
    topExperiences,
    topHotelsByBookings,
    averageDealCents,
    totalRevenueCents,
  })
}
