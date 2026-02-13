import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { createPaymentLink } from '@/lib/stripe'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestBookingApproved } from '@/lib/email/templates'
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

    // Check if already processed
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

    // Accept as-is: use guest's requested date and time (supplier cannot change them)
    if (!reservation.requested_date || !reservation.requested_time) {
      return NextResponse.json(
        { error: 'This request has no specific time. Please decline and suggest alternative times.' },
        { status: 400 }
      )
    }
    const formattedTime =
      reservation.requested_time.length === 5
        ? `${reservation.requested_time}:00`
        : reservation.requested_time

    // Get hotel config for redirect URL
    const { data: hotelConfig } = await supabase
      .from('hotel_configs')
      .select('slug')
      .eq('partner_id', reservation.hotel_id)
      .single()

    const hotelSlug = (hotelConfig as any)?.slug || 'default'
    const appUrl = getAppUrl()

    // Create or find session for this date/time
    let sessionId = reservation.session_id

    if (!sessionId) {
      // Create a private session for this booking (status 'booked' — not visible in widget)
      const { data: newSession, error: sessionError } = await (supabase
        .from('experience_sessions') as any)
        .insert({
          experience_id: experience.id,
          session_date: reservation.requested_date,
          start_time: formattedTime,
          spots_total: experience.max_participants,
          spots_available: 0,
          session_status: 'booked', // Private: not shown in widget
        })
        .select()
        .single()

      if (sessionError || !newSession) {
        console.error('Failed to create session:', sessionError)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
      }

      sessionId = newSession.id

      // Update reservation with session_id
      await (supabase.from('reservations') as any)
        .update({ session_id: sessionId, updated_at: new Date().toISOString() })
        .eq('id', reservation.id)
    }

    // Create Stripe Payment Link
    const paymentLink = await createPaymentLink({
      reservationId: reservation.id,
      experienceTitle: experience.title,
      amountCents: reservation.total_cents,
      currency: experience.currency,
      successUrl: `${appUrl}/${hotelSlug}/confirmation/${reservation.id}`,
      cancelUrl: `${appUrl}/${hotelSlug}/reservation/${reservation.id}`,
    })

    // Update reservation
    const paymentDeadline = addHours(new Date(), 24)

    await (supabase.from('reservations') as any)
      .update({
        reservation_status: 'approved',
        requested_time: formattedTime, // Update time if it was flexible
        payment_deadline: paymentDeadline.toISOString(),
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)

    // Send email to guest with payment link
    const emailHtml = guestBookingApproved({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date: reservation.requested_date || '',
      time: formattedTime,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      paymentUrl: paymentLink.url!,
      meetingPoint: experience.meeting_point,
      paymentDeadline: paymentDeadline.toISOString(),
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
