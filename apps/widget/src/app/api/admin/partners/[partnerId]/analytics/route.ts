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
  if (!(await verifyAdminAccess(request))) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { partnerId } = await params
  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const supabase = createAdminClient()

  function dateFilter<T extends { gte: (col: string, val: string) => T; lte: (col: string, val: string) => T }>(q: T): T {
    if (from) q = q.gte('created_at', `${from}T00:00:00Z`)
    if (to) q = q.lte('created_at', `${to}T23:59:59Z`)
    return q
  }

  // =====================================================================
  // Resolve partner capabilities
  // =====================================================================
  const [
    { data: hotelConfigs },
    { data: partnerExperiences },
  ] = await Promise.all([
    supabase.from('hotel_configs').select('id, display_name, slug').eq('partner_id', partnerId),
    supabase.from('experiences').select('id, title').eq('partner_id', partnerId),
  ])

  const configs = hotelConfigs || []
  const experiences = partnerExperiences || []
  const configIds = configs.map(c => c.id)
  const experienceIds = experiences.map(e => e.id)
  const hasHotel = configIds.length > 0
  const hasExperiences = experienceIds.length > 0

  // =====================================================================
  // HOTEL ANALYTICS (per property)
  // =====================================================================
  let hotelAnalytics: any = null

  if (hasHotel) {
    // Widget views per property
    const { data: viewRows } = await dateFilter(
      supabase.from('analytics_events')
        .select('hotel_config_id, source, created_at')
        .eq('event_type', 'widget_view')
        .in('hotel_config_id', configIds)
    )

    // Experience views per property
    const { data: expViewRows } = await dateFilter(
      supabase.from('analytics_events')
        .select('hotel_config_id, experience_id, event_type')
        .in('event_type', ['experience_view', 'experience_details'])
        .in('hotel_config_id', configIds)
    )

    // Reservations through this hotel partner
    const { data: reservationRows } = await dateFilter(
      supabase.from('reservations')
        .select('id, reservation_status, is_request, hotel_config_id, experience_id')
        .eq('hotel_id', partnerId)
    )

    // Bookings through this hotel partner
    const { data: bookingRows } = await (dateFilter(
      supabase.from('bookings')
        .select('id, amount_cents, booking_status, reservation:reservations!inner(experience_id, hotel_id, hotel_config_id)')
        .eq('reservation.hotel_id', partnerId) as any
    ))

    // Collect all experience IDs referenced in views/bookings to fetch titles
    const allExpIds = new Set<string>()
    for (const r of expViewRows || []) if (r.experience_id) allExpIds.add(r.experience_id)
    for (const r of reservationRows || []) if (r.experience_id) allExpIds.add(r.experience_id)
    for (const b of bookingRows || []) if (b.reservation?.experience_id) allExpIds.add(b.reservation.experience_id)

    const expTitleMap = new Map<string, string>()
    if (allExpIds.size > 0) {
      const { data: exps } = await supabase.from('experiences').select('id, title').in('id', Array.from(allExpIds))
      for (const e of exps || []) expTitleMap.set(e.id, e.title)
    }

    // Build per-property data
    const properties = configs.map(config => {
      const cid = config.id

      // Widget views
      const propViews = (viewRows || []).filter(r => r.hotel_config_id === cid)
      const sourceMap = new Map<string, number>()
      const dayMap = new Map<string, number>()
      for (const row of propViews) {
        const src = row.source || 'direct'
        sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
        const day = row.created_at.slice(0, 10)
        dayMap.set(day, (dayMap.get(day) || 0) + 1)
      }

      // Experience views on this property
      const propExpViews = (expViewRows || []).filter(r => r.hotel_config_id === cid)
      const expViewMap = new Map<string, { listViews: number; detailViews: number }>()
      for (const row of propExpViews) {
        if (!row.experience_id) continue
        const existing = expViewMap.get(row.experience_id) || { listViews: 0, detailViews: 0 }
        if (row.event_type === 'experience_view') existing.listViews++
        if (row.event_type === 'experience_details') existing.detailViews++
        expViewMap.set(row.experience_id, existing)
      }

      // Reservations through this property
      const propRes = (reservationRows || []).filter((r: any) => r.hotel_config_id === cid)
      const requests = propRes.filter((r: any) => r.is_request).length
      const accepted = propRes.filter((r: any) => r.reservation_status === 'approved').length
      const declined = propRes.filter((r: any) => r.reservation_status === 'declined').length
      const expired = propRes.filter((r: any) => r.reservation_status === 'expired').length

      // Bookings through this property
      const propBookings = (bookingRows || []).filter((b: any) => b.reservation?.hotel_config_id === cid)
      const paid = propBookings.filter((b: any) => b.booking_status === 'confirmed' || b.booking_status === 'completed')
      const booked = paid.length
      const cancelled = propBookings.filter((b: any) => b.booking_status === 'cancelled').length
      const revenueCents = paid.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0)
      const avgDealCents = booked > 0 ? Math.round(revenueCents / booked) : 0

      // Booking counts per experience (for the experience views table)
      const expBookingMap = new Map<string, number>()
      for (const b of paid) {
        const eid = b.reservation?.experience_id
        if (eid) expBookingMap.set(eid, (expBookingMap.get(eid) || 0) + 1)
      }

      // Top experiences by revenue
      const topExpMap = new Map<string, { bookings: number; revenueCents: number }>()
      for (const b of paid) {
        const eid = b.reservation?.experience_id
        if (!eid) continue
        const existing = topExpMap.get(eid) || { bookings: 0, revenueCents: 0 }
        existing.bookings++
        existing.revenueCents += b.amount_cents || 0
        topExpMap.set(eid, existing)
      }

      return {
        hotelConfigId: cid,
        name: config.display_name,
        slug: config.slug,
        widgetViews: propViews.length,
        viewsBySource: Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count })),
        viewsByDay: Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count })),
        experienceViews: Array.from(expViewMap.entries()).map(([experienceId, data]) => ({
          experienceId,
          title: expTitleMap.get(experienceId) || 'Unknown',
          listViews: data.listViews,
          detailViews: data.detailViews,
          bookings: expBookingMap.get(experienceId) || 0,
        })),
        bookingPerformance: { requests, accepted, declined, expired, booked, cancelled },
        transactionPerformance: {
          totalRevenueCents: revenueCents,
          averageDealCents: avgDealCents,
          paidBookings: booked,
          topExperiences: Array.from(topExpMap.entries())
            .map(([experienceId, data]) => ({
              experienceId,
              title: expTitleMap.get(experienceId) || 'Unknown',
              bookings: data.bookings,
              revenueCents: data.revenueCents,
            }))
            .sort((a, b) => b.revenueCents - a.revenueCents),
        },
      }
    })

    hotelAnalytics = { properties }
  }

  // =====================================================================
  // SUPPLIER ANALYTICS (per experience)
  // =====================================================================
  let supplierAnalytics: any = null

  if (hasExperiences) {
    // Views of this supplier's experiences (across all hotels)
    const { data: expViewRows } = await dateFilter(
      supabase.from('analytics_events')
        .select('experience_id, hotel_config_id, event_type')
        .in('event_type', ['experience_view', 'experience_details'])
        .in('experience_id', experienceIds)
    )

    // Reservations for this supplier's experiences
    const { data: reservationRows } = await dateFilter(
      supabase.from('reservations')
        .select('id, reservation_status, is_request, experience_id, hotel_config_id')
        .in('experience_id', experienceIds)
    )

    // Bookings for this supplier's experiences
    const { data: bookingRows } = await (dateFilter(
      supabase.from('bookings')
        .select('id, amount_cents, supplier_amount_cents, booking_status, reservation:reservations!inner(experience_id, hotel_config_id)')
        .in('reservation.experience_id', experienceIds) as any
    ))

    // Collect hotel_config_ids to fetch names
    const hotelConfigIdsInData = new Set<string>()
    for (const r of expViewRows || []) if (r.hotel_config_id) hotelConfigIdsInData.add(r.hotel_config_id)
    for (const r of reservationRows || []) if (r.hotel_config_id) hotelConfigIdsInData.add(r.hotel_config_id)
    for (const b of bookingRows || []) if (b.reservation?.hotel_config_id) hotelConfigIdsInData.add(b.reservation.hotel_config_id)

    const hotelNameMap = new Map<string, string>()
    if (hotelConfigIdsInData.size > 0) {
      const { data: hcs } = await supabase.from('hotel_configs').select('id, display_name').in('id', Array.from(hotelConfigIdsInData))
      for (const hc of hcs || []) hotelNameMap.set(hc.id, hc.display_name)
    }

    const expTitleMap = new Map<string, string>()
    for (const e of experiences) expTitleMap.set(e.id, e.title)

    // Build per-experience data
    const experienceAnalytics = experiences.map(exp => {
      const eid = exp.id

      // Views
      const expViews = (expViewRows || []).filter(r => r.experience_id === eid)
      const totalListViews = expViews.filter(r => r.event_type === 'experience_view').length
      const totalDetailViews = expViews.filter(r => r.event_type === 'experience_details').length

      // Views by hotel
      const hotelViewMap = new Map<string, { listViews: number; detailViews: number }>()
      for (const row of expViews) {
        const hcid = row.hotel_config_id || '__direct__'
        const existing = hotelViewMap.get(hcid) || { listViews: 0, detailViews: 0 }
        if (row.event_type === 'experience_view') existing.listViews++
        if (row.event_type === 'experience_details') existing.detailViews++
        hotelViewMap.set(hcid, existing)
      }

      // Reservations for this experience
      const expRes = (reservationRows || []).filter((r: any) => r.experience_id === eid)
      const requests = expRes.filter((r: any) => r.is_request).length
      const accepted = expRes.filter((r: any) => r.reservation_status === 'approved').length
      const declined = expRes.filter((r: any) => r.reservation_status === 'declined').length
      const expired = expRes.filter((r: any) => r.reservation_status === 'expired').length

      // Bookings for this experience
      const expBookings = (bookingRows || []).filter((b: any) => b.reservation?.experience_id === eid)
      const paid = expBookings.filter((b: any) => b.booking_status === 'confirmed' || b.booking_status === 'completed')
      const booked = paid.length
      const cancelled = expBookings.filter((b: any) => b.booking_status === 'cancelled').length
      const totalRevenueCents = paid.reduce((sum: number, b: any) => sum + (b.amount_cents || 0), 0)
      const supplierShareCents = paid.reduce((sum: number, b: any) => sum + (b.supplier_amount_cents || 0), 0)
      const avgDealCents = booked > 0 ? Math.round(totalRevenueCents / booked) : 0

      // Revenue by hotel
      const hotelRevenueMap = new Map<string, { bookings: number; revenueCents: number }>()
      for (const b of paid) {
        const hcid = b.reservation?.hotel_config_id || '__direct__'
        const existing = hotelRevenueMap.get(hcid) || { bookings: 0, revenueCents: 0 }
        existing.bookings++
        existing.revenueCents += b.amount_cents || 0
        hotelRevenueMap.set(hcid, existing)
      }

      return {
        experienceId: eid,
        title: exp.title,
        totalListViews,
        totalDetailViews,
        viewsByHotel: Array.from(hotelViewMap.entries()).map(([hotelConfigId, data]) => ({
          hotelConfigId: hotelConfigId === '__direct__' ? null : hotelConfigId,
          hotelName: hotelConfigId === '__direct__' ? 'Veyond direct' : (hotelNameMap.get(hotelConfigId) || 'Unknown'),
          listViews: data.listViews,
          detailViews: data.detailViews,
        })),
        bookingPerformance: { requests, accepted, declined, expired, booked, cancelled },
        revenue: {
          totalRevenueCents,
          supplierShareCents,
          averageDealCents: avgDealCents,
          revenueByHotel: Array.from(hotelRevenueMap.entries())
            .map(([hotelConfigId, data]) => ({
              hotelConfigId: hotelConfigId === '__direct__' ? null : hotelConfigId,
              hotelName: hotelConfigId === '__direct__' ? 'Veyond direct' : (hotelNameMap.get(hotelConfigId) || 'Unknown'),
              bookings: data.bookings,
              revenueCents: data.revenueCents,
            }))
            .sort((a, b) => b.revenueCents - a.revenueCents),
        },
      }
    })

    supplierAnalytics = { experiences: experienceAnalytics }
  }

  return jsonResponse({ hotelAnalytics, supplierAnalytics })
}
