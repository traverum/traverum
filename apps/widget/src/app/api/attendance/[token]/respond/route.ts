import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/index'
import { baseTemplate, guestNoShowCharged, guestCancellationChargeFailed } from '@/lib/email/templates'
import { escapeHtml } from '@/lib/sanitize'
import { PAYMENT_MODES } from '@traverum/shared'
import { processCancellationCharge } from '@/lib/cancellation-charges'

interface RouteParams {
  params: Promise<{ token: string }>
}

const VALID_RESPONSES = ['attended', 'not_attended'] as const
type GuestResponse = typeof VALID_RESPONSES[number]

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params

  let body: { response?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const guestResponse = body.response as GuestResponse
  if (!VALID_RESPONSES.includes(guestResponse)) {
    return NextResponse.json(
      { error: 'Invalid response. Must be "attended" or "not_attended".' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: verification } = await supabase
    .from('attendance_verifications')
    .select(`
      *,
      booking:bookings(
        *,
        reservation:reservations(
          *,
          experience:experiences(
            title,
            currency,
            supplier:partners!experiences_partner_fk(email, name)
          ),
          session:experience_sessions(session_date, start_time)
        )
      )
    `)
    .eq('verification_token', token)
    .single()

  if (!verification) {
    return NextResponse.json({ error: 'Invalid verification token' }, { status: 404 })
  }

  const v = verification as any

  if (v.outcome !== 'pending') {
    return NextResponse.json({ error: 'This verification has already been resolved.' }, { status: 400 })
  }

  if (new Date(v.deadline) < new Date()) {
    return NextResponse.json({ error: 'The deadline to respond has passed.' }, { status: 400 })
  }

  const booking = v.booking
  const reservation = booking.reservation
  const experience = reservation.experience
  const supplier = experience.supplier

  try {
    if (guestResponse === 'attended') {
      await (supabase.from('attendance_verifications') as any)
        .update({
          guest_response: 'attended',
          responded_at: new Date().toISOString(),
          outcome: 'guest_overridden',
        })
        .eq('id', v.id)

      await (supabase.from('bookings') as any)
        .update({
          booking_status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)

      if (supplier?.email) {
        await sendEmail({
          to: supplier.email,
          subject: `Guest confirmed attendance - ${experience.title}`,
          html: baseTemplate(`
            <div class="card">
              <div class="header"><h1>Guest Confirmed Attendance</h1></div>
              <p>Hi ${escapeHtml(supplier.name)},</p>
              <p>The guest has confirmed that they attended this experience. The booking has been marked as completed and commission will apply.</p>
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Experience</span>
                  <span class="info-value">${experience.title}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Guest</span>
                  <span class="info-value">${escapeHtml(reservation.guest_name)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Booking Reference</span>
                  <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
              <p class="text-muted">Commission for this booking will be included in your monthly invoice.</p>
            </div>
          `, 'Guest Confirmed Attendance'),
        })
      }

      console.log(`Attendance verification resolved: guest_overridden for booking ${booking.id}`)

      return NextResponse.json({
        success: true,
        outcome: 'guest_overridden',
        message: 'Thank you for confirming. Your booking has been marked as completed.',
      })
    }

    // Guest confirms they did NOT attend
    await (supabase.from('attendance_verifications') as any)
      .update({
        guest_response: 'not_attended',
        responded_at: new Date().toISOString(),
        outcome: 'supplier_upheld',
      })
      .eq('id', v.id)

    await (supabase.from('bookings') as any)
      .update({
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    if (reservation.session_id) {
      await (supabase.from('experience_sessions') as any)
        .update({
          session_status: 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.session_id)
    }

    // Charge guest's saved card for no-show (pay_on_site only)
    let chargeSucceeded = false
    const isPayOnSite = booking.payment_mode === PAYMENT_MODES.PAY_ON_SITE
    const setupIntentId = reservation.stripe_setup_intent_id
    const customerId = reservation.stripe_customer_id

    if (isPayOnSite && setupIntentId && customerId) {
      const chargeResult = await processCancellationCharge({
        supabase,
        bookingId: booking.id,
        stripeSetupIntentId: setupIntentId,
        stripeCustomerId: customerId,
        amountCents: booking.amount_cents,
        currency: experience.currency || 'EUR',
        reason: 'no_show',
        commissionSplitCents: {
          supplier: booking.supplier_amount_cents,
          hotel: booking.hotel_amount_cents,
          platform: booking.platform_amount_cents,
        },
      })
      chargeSucceeded = chargeResult.success

      const experienceDate = reservation.session?.session_date || reservation.requested_date || ''

      if (chargeResult.success) {
        await sendEmail({
          to: reservation.guest_email,
          subject: `No-show fee charged - ${experience.title}`,
          html: guestNoShowCharged({
            experienceTitle: experience.title,
            guestName: reservation.guest_name,
            date: experienceDate,
            bookingId: booking.id,
            chargeAmountCents: booking.amount_cents,
            currency: experience.currency,
          }),
        })
      } else {
        await sendEmail({
          to: reservation.guest_email,
          subject: `Booking cancelled - ${experience.title}`,
          html: guestCancellationChargeFailed({
            experienceTitle: experience.title,
            guestName: reservation.guest_name,
            date: experienceDate,
            bookingId: booking.id,
            chargeAmountCents: booking.amount_cents,
            currency: experience.currency,
            reason: 'no_show',
          }),
        })
      }
    }

    if (supplier?.email) {
      await sendEmail({
        to: supplier.email,
        subject: `Guest confirmed no attendance - ${experience.title}`,
        html: baseTemplate(`
          <div class="card">
            <div class="header"><h1>No Attendance Confirmed</h1></div>
            <p>Hi ${escapeHtml(supplier.name)},</p>
            <p>The guest has confirmed that they did not attend. The booking has been cancelled. No commission applies.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Experience</span>
                <span class="info-value">${experience.title}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Guest</span>
                <span class="info-value">${escapeHtml(reservation.guest_name)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Booking Reference</span>
                <span class="info-value">${booking.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        `, 'No Attendance Confirmed'),
      })
    }

    console.log(`Attendance verification resolved: supplier_upheld for booking ${booking.id}` +
      (isPayOnSite ? `, no-show charge ${chargeSucceeded ? 'succeeded' : 'failed'}` : ''))

    const responseMessage = isPayOnSite && chargeSucceeded
      ? 'Thank you for your response. The booking has been cancelled. A no-show fee has been charged to your card.'
      : 'Thank you for your response. The booking has been cancelled.'

    return NextResponse.json({
      success: true,
      outcome: 'supplier_upheld',
      message: responseMessage,
    })
  } catch (error) {
    console.error('Attendance verification respond error:', error)
    return NextResponse.json({ error: 'Failed to process response. Please try again.' }, { status: 500 })
  }
}
