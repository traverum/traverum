import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { createPaymentLink } from '@/lib/stripe'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestBookingApproved, guestProvideGuarantee } from '@/lib/email/templates'
import { PAYMENT_DEADLINE_HOURS, PAYMENT_MODES } from '@traverum/shared'
import { addHours } from 'date-fns'
import type { Database } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Authenticate via Supabase JWT from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Create a Supabase client with the user's JWT to verify identity
    const userClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get() { return undefined }, set() {}, remove() {} },
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get reservation with related data
    const { data: reservationData } = await supabase
      .from('reservations')
      .select(`
        *,
        experience:experiences(
          *,
          supplier:partners!experiences_partner_fk(*)
        ),
        session:experience_sessions(*),
        hotel:partners!reservations_hotel_fk(*)
      `)
      .eq('id', id)
      .single()

    if (!reservationData) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservation = reservationData as any
    const experience = reservation.experience
    const supplier = experience.supplier

    // Look up the app user by auth_id (user.id from Supabase Auth is the auth UUID,
    // but user_partners.user_id references the app users.id — not the auth UUID)
    const { data: appUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null }

    if (!appUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    // Verify the authenticated user owns the supplier partner
    const { data: userPartner } = await supabase
      .from('user_partners')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('partner_id', supplier.id)
      .single() as { data: { id: string } | null }

    if (!userPartner) {
      return NextResponse.json({ error: 'Forbidden: you do not own this experience' }, { status: 403 })
    }

    // Stripe onboarding only required for suppliers using stripe payment mode
    // (pay_on_site suppliers collect payment directly, no connected account needed)
    const supplierPaymentMode = supplier.payment_mode || PAYMENT_MODES.PAY_ON_SITE
    if (supplierPaymentMode === PAYMENT_MODES.STRIPE && !supplier.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'You need to complete Stripe onboarding before accepting bookings. Go to your dashboard to finish setup.' },
        { status: 400 }
      )
    }

    // Idempotent: if already approved, return success (avoids confusing error
    // when the supplier double-clicks or retries)
    if (reservation.reservation_status === 'approved') {
      return NextResponse.json({ success: true })
    }

    if (reservation.reservation_status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${reservation.reservation_status}` },
        { status: 400 }
      )
    }

    // This route handles custom request acceptance
    // Session-based bookings are auto-approved and should not reach this endpoint
    if (!reservation.is_request) {
      return NextResponse.json(
        { error: 'This is not a custom request. Session-based bookings are handled automatically.' },
        { status: 400 }
      )
    }

    const isRental = experience.pricing_type === 'per_day'
    const today = new Date().toISOString().slice(0, 10)
    const relevantDate = isRental
      ? (reservation.rental_start_date || reservation.requested_date)
      : reservation.requested_date

    if (relevantDate && relevantDate < today) {
      return NextResponse.json(
        { error: 'This request is for a date that has already passed. Please dismiss it instead.' },
        { status: 400 }
      )
    }

    // For non-rental requests: we need both date and time
    if (!isRental && (!reservation.requested_date || !reservation.requested_time)) {
      return NextResponse.json(
        { error: 'This request has no specific time. Please decline and suggest alternative times.' },
        { status: 400 }
      )
    }

    // For rental requests: we only need the requested_date
    if (isRental && !reservation.requested_date) {
      return NextResponse.json(
        { error: 'This rental request has no start date.' },
        { status: 400 }
      )
    }

    const formattedTime = reservation.requested_time
      ? (reservation.requested_time.length === 5 ? `${reservation.requested_time}:00` : reservation.requested_time)
      : null

    // Get hotel config for redirect URL (skip for direct Veyond bookings)
    const isDirect = !reservation.hotel_id
    let hotelSlug: string | null = null
    if (!isDirect && reservation.hotel_config_id) {
      const { data: hotelConfig } = await supabase
        .from('hotel_configs')
        .select('slug')
        .eq('id', reservation.hotel_config_id)
        .single()
      hotelSlug = (hotelConfig as any)?.slug || null
    }
    const appUrl = getAppUrl()

    // Create or find session for this date/time (skip for rentals — no session needed)
    let sessionId = reservation.session_id

    if (!isRental && !sessionId && reservation.requested_date && formattedTime) {
      const { data: newSession, error: sessionError } = await (supabase
        .from('experience_sessions') as any)
        .insert({
          experience_id: experience.id,
          session_date: reservation.requested_date,
          start_time: formattedTime,
          spots_total: experience.max_participants,
          spots_available: 0,
          session_status: 'booked',
        })
        .select()
        .single()

      if (sessionError || !newSession) {
        console.error('Failed to create session:', sessionError)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }

      sessionId = newSession.id

      await (supabase.from('reservations') as any)
        .update({ session_id: sessionId, updated_at: new Date().toISOString() })
        .eq('id', reservation.id)
    }

    // Shared date/time resolution for emails
    const emailDate = isRental
      ? (reservation.rental_start_date || reservation.requested_date || '')
      : (reservation.requested_date || '')
    const emailTime = isRental ? '' : (formattedTime || '')

    let emailRentalDays: number | undefined
    let emailRentalEndDate: string | undefined
    if (isRental && reservation.rental_start_date && reservation.rental_end_date) {
      emailRentalEndDate = reservation.rental_end_date
      emailRentalDays = Math.max(1, Math.round(
        (new Date(reservation.rental_end_date + 'T12:00:00').getTime() - new Date(reservation.rental_start_date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
      ) + 1)
    }

    // ── pay_on_site: skip Payment Link, send "provide card guarantee" email ──
    if (supplierPaymentMode === PAYMENT_MODES.PAY_ON_SITE) {
      await (supabase.from('reservations') as any)
        .update({
          reservation_status: 'approved',
          ...(formattedTime ? { requested_time: formattedTime } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)

      const guaranteePath = (isDirect || !hotelSlug)
        ? `/experiences/reservation/${reservation.id}/guarantee`
        : `/${hotelSlug}/reservation/${reservation.id}/guarantee`

      const emailHtml = guestProvideGuarantee({
        experienceTitle: experience.title,
        guestName: reservation.guest_name,
        date: emailDate,
        time: emailTime,
        participants: reservation.participants,
        totalCents: reservation.total_cents,
        currency: experience.currency,
        guaranteeUrl: `${appUrl}${guaranteePath}`,
        meetingPoint: experience.meeting_point,
        ...(isRental ? { rentalEndDate: emailRentalEndDate, rentalDays: emailRentalDays } : {}),
      })

      await sendEmail({
        to: reservation.guest_email,
        subject: `Your request was accepted! Confirm your reservation - ${experience.title}`,
        html: emailHtml,
      })

      return NextResponse.json({ success: true, sessionId })
    }

    // ── stripe (default): Create Payment Link ──
    const useDirectPaths = isDirect || !hotelSlug
    const successPath = useDirectPaths
      ? `/experiences/confirmation/${reservation.id}`
      : `/${hotelSlug}/confirmation/${reservation.id}`
    const cancelPath = useDirectPaths
      ? `/experiences/reservation/${reservation.id}`
      : `/${hotelSlug}/reservation/${reservation.id}`

    const paymentLink = await createPaymentLink({
      reservationId: reservation.id,
      experienceTitle: experience.title,
      amountCents: reservation.total_cents,
      currency: experience.currency,
      successUrl: `${appUrl}${successPath}`,
      cancelUrl: `${appUrl}${cancelPath}`,
    })

    const paymentDeadline = addHours(new Date(), PAYMENT_DEADLINE_HOURS)

    await (supabase.from('reservations') as any)
      .update({
        reservation_status: 'approved',
        ...(formattedTime ? { requested_time: formattedTime } : {}),
        payment_deadline: paymentDeadline.toISOString(),
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)

    const emailHtml = guestBookingApproved({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date: emailDate,
      time: emailTime,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      paymentUrl: paymentLink.url!,
      meetingPoint: experience.meeting_point,
      paymentDeadline: paymentDeadline.toISOString(),
      ...(isRental ? { rentalEndDate: emailRentalEndDate, rentalDays: emailRentalDays } : {}),
    })

    await sendEmail({
      to: reservation.guest_email,
      subject: `Your booking is approved! Complete payment - ${experience.title}`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    console.error('Dashboard accept error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
