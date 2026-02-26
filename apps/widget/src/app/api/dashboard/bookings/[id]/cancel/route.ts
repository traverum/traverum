import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { createRefund } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
import { guestRefundProcessed } from '@/lib/email/templates'
import type { Database } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

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

    // Fetch booking with reservation, experience, and session
    const { data: bookingData } = await supabase
      .from('bookings')
      .select(`
        *,
        reservation:reservations(
          *,
          experience:experiences(
            *,
            supplier:partners!experiences_partner_fk(*)
          ),
          session:experience_sessions(*)
        )
      `)
      .eq('id', id)
      .single()

    if (!bookingData) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const booking = bookingData as any
    const reservation = booking.reservation
    const experience = reservation.experience
    const supplier = experience.supplier
    const session = reservation.session

    if (booking.booking_status !== 'confirmed') {
      return NextResponse.json(
        { error: `Booking has already been ${booking.booking_status}` },
        { status: 400 }
      )
    }

    // Resolve auth UUID to app user, then verify ownership
    const { data: appUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null }

    if (!appUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 })
    }

    const { data: userPartner } = await supabase
      .from('user_partners')
      .select('id')
      .eq('user_id', appUser.id)
      .eq('partner_id', supplier.id)
      .single() as { data: { id: string } | null }

    if (!userPartner) {
      return NextResponse.json({ error: 'Forbidden: you do not own this experience' }, { status: 403 })
    }

    // Process Stripe refund
    if (booking.stripe_charge_id) {
      await createRefund(booking.stripe_charge_id)
    }

    // Update booking status to cancelled and clear session reference so we can delete the session
    await (supabase
      .from('bookings') as any)
      .update({
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_id: null,
      })
      .eq('id', id)

    // Delete the session so the slot is removed from the calendar
    if (reservation.session_id) {
      await (supabase.from('experience_sessions') as any)
        .delete()
        .eq('id', reservation.session_id)
    }

    // Email guest with refund confirmation
    const date = session?.session_date || reservation.requested_date || ''
    const time = session?.start_time || reservation.requested_time || ''

    const guestEmailHtml = guestRefundProcessed({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      bookingId: booking.id,
      refundAmount: booking.amount_cents,
    })

    await sendEmail({
      to: reservation.guest_email,
      subject: `Refund processed - ${experience.title}`,
      html: guestEmailHtml,
    })

    console.log(`Supplier cancelled booking ${id}, refund initiated`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dashboard cancel booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
