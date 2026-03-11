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

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, name, email, partner_type, city, country, stripe_account_id, stripe_onboarding_complete, created_at')
    .eq('id', partnerId)
    .single() as {
      data: {
        id: string
        name: string
        email: string
        partner_type: string
        city: string | null
        country: string | null
        stripe_account_id: string | null
        stripe_onboarding_complete: boolean | null
        created_at: string | null
      } | null
      error: any
    }

  if (partnerError || !partner) {
    return jsonResponse({ error: 'Partner not found' }, 404)
  }

  const [
    { data: payouts },
    { data: bookings },
    { data: distributions },
    { count: hotelConfigCount },
    { count: experienceCount },
  ] = await Promise.all([
    supabase
      .from('hotel_payouts')
      .select('id, amount_cents, status')
      .eq('partner_id', partnerId),
    (supabase
      .from('bookings')
      .select(`
        id,
        amount_cents,
        supplier_amount_cents,
        hotel_amount_cents,
        platform_amount_cents,
        hotel_payout_id,
        booking_status,
        reservation:reservations!inner(hotel_id)
      `)
      .eq('reservation.hotel_id', partnerId)
      .eq('booking_status', 'completed') as any),
    (supabase
      .from('distributions')
      .select(`
        commission_supplier,
        commission_hotel,
        commission_platform,
        experience:experiences(id, title),
        is_active
      `)
      .eq('hotel_id', partnerId)
      .eq('is_active', true) as any),
    supabase
      .from('hotel_configs')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partnerId),
    supabase
      .from('experiences')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', partnerId),
  ])

  const payoutRows = payouts || []
  const bookingRows = bookings || []

  const paidPayoutCount = payoutRows.filter((p: any) => p.status === 'paid').length
  const pendingPayoutCount = payoutRows.filter((p: any) => p.status === 'pending').length
  const paidCents = payoutRows
    .filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)
  const pendingCents = payoutRows
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0)

  const earnedCents = bookingRows.reduce(
    (sum: number, b: any) => sum + (b.hotel_amount_cents || 0),
    0
  )
  const unassignedBookingCount = bookingRows.filter((b: any) => !b.hotel_payout_id).length
  const reconciliationMismatchCount = bookingRows.filter((b: any) => {
    const total = b.amount_cents || 0
    const splitTotal =
      (b.supplier_amount_cents || 0) +
      (b.hotel_amount_cents || 0) +
      (b.platform_amount_cents || 0)
    return total !== splitTotal
  }).length

  const commissionRates = (distributions || []).map((distribution: any) => ({
    experienceId: distribution.experience?.id || null,
    experienceTitle: distribution.experience?.title || 'Unknown experience',
    supplier: distribution.commission_supplier,
    hotel: distribution.commission_hotel,
    platform: distribution.commission_platform,
  }))

  const has_hotel_config = (hotelConfigCount ?? 0) > 0
  const has_experiences = (experienceCount ?? 0) > 0

  return jsonResponse({
    partner: {
      ...partner,
      has_hotel_config,
      has_experiences,
    },
    summary: {
      earnedCents,
      paidCents,
      pendingCents,
      pendingFromEarningsCents: Math.max(0, earnedCents - paidCents),
      completedBookingCount: bookingRows.length,
      unassignedBookingCount,
      payoutCount: payoutRows.length,
      paidPayoutCount,
      pendingPayoutCount,
      reconciliationMismatchCount,
    },
    commissionRates,
  })
}
