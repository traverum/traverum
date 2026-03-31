import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculateCommissionSplit } from '@/lib/commission'
import { sendEmail, sendBatchEmails, getAppUrl } from '@/lib/email/index'
import {
  guestReservationConfirmedPayOnSite,
  supplierNewBookingPayOnSite,
  hotelBookingNotification,
} from '@/lib/email/templates'
import { generateCancelToken } from '@/lib/tokens'
import { getCancellationPolicyText, CANCELLATION_POLICIES } from '@/lib/availability'
import {
  resolveCommissionRates,
  resolveExperienceDate,
  computeRentalDaysFromDates,
} from '@/lib/booking-rules'
import { PAYMENT_MODES } from '@traverum/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/reservations/[id]/confirm-guarantee
 *
 * Called after the guest's Setup Intent is confirmed client-side.
 * Verifies the Setup Intent succeeded, creates the booking record
 * (with payment_mode='pay_on_site', paid_at=null), marks the session
 * as booked, and sends confirmation emails with guest contact revealed.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: reservationId } = await params

  try {
    const supabase = createAdminClient()
    const appUrl = getAppUrl()

    // ── 1. Load reservation with all related data ──
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
      .eq('id', reservationId)
      .single()

    if (!reservationData) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservation = reservationData as any
    const experience = reservation.experience
    const supplier = experience?.supplier
    const session = reservation.session

    if (!experience || !supplier) {
      return NextResponse.json({ error: 'Reservation data is incomplete' }, { status: 400 })
    }

    // ── 2. Validate state ──
    if (reservation.reservation_status !== 'approved') {
      return NextResponse.json(
        { error: `Reservation is ${reservation.reservation_status}, expected approved` },
        { status: 400 }
      )
    }

    const supplierPaymentMode = supplier.payment_mode || PAYMENT_MODES.PAY_ON_SITE
    if (supplierPaymentMode !== PAYMENT_MODES.PAY_ON_SITE) {
      return NextResponse.json(
        { error: 'This endpoint is only for pay_on_site reservations' },
        { status: 400 }
      )
    }

    // Check idempotency: booking already exists
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('reservation_id', reservationId)
      .single()

    if (existingBooking) {
      return NextResponse.json({
        success: true,
        bookingId: (existingBooking as any).id,
        message: 'Booking already exists',
      })
    }

    // ── 3. Verify Setup Intent succeeded ──
    const setupIntentId = reservation.stripe_setup_intent_id
    if (!setupIntentId) {
      return NextResponse.json(
        { error: 'No Setup Intent found on this reservation. Save your card first.' },
        { status: 400 }
      )
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Setup Intent is not confirmed (status: ${setupIntent.status})` },
        { status: 400 }
      )
    }

    // Store the customer ID from the Setup Intent if not already on the reservation
    const stripeCustomerId = reservation.stripe_customer_id || (setupIntent.customer as string)
    if (!reservation.stripe_customer_id && stripeCustomerId) {
      await (supabase.from('reservations') as any)
        .update({
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservationId)
    }

    // ── 4. Calculate commission split ──
    const isDirect = !reservation.hotel_id
    let distributionData = null
    if (!isDirect) {
      let query = supabase
        .from('distributions')
        .select('*')
        .eq('experience_id', experience.id)
        .eq('hotel_id', reservation.hotel_id)
        .eq('is_active', true)

      if (reservation.hotel_config_id) {
        query = query.eq('hotel_config_id', reservation.hotel_config_id)
      }

      const { data, error: distError } = await query.limit(1).maybeSingle()
      if (distError) {
        console.error('Distribution lookup failed:', distError, {
          experienceId: experience.id,
          hotelId: reservation.hotel_id,
          hotelConfigId: reservation.hotel_config_id,
        })
      }
      distributionData = data as any
    }

    const { rates, error: ratesError } = resolveCommissionRates({
      isDirect,
      distribution: distributionData,
    })
    if (!rates) {
      console.error(`${ratesError} for experience ${experience.id} and hotel ${reservation.hotel_id}`)
      return NextResponse.json({ error: 'Commission rates not found' }, { status: 500 })
    }

    const split = calculateCommissionSplit(reservation.total_cents, rates)

    // ── 5. Create booking record ──
    const { data: booking, error: bookingError } = await (supabase
      .from('bookings') as any)
      .insert({
        reservation_id: reservationId,
        session_id: reservation.session_id || session?.id || null,
        amount_cents: reservation.total_cents,
        supplier_amount_cents: split.supplierAmount,
        hotel_amount_cents: split.hotelAmount,
        platform_amount_cents: split.platformAmount,
        booking_status: 'confirmed',
        payment_mode: PAYMENT_MODES.PAY_ON_SITE,
        // No Stripe payment — guest pays supplier directly on site
        stripe_payment_intent_id: null,
        stripe_charge_id: null,
        paid_at: null,
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Failed to create pay_on_site booking:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    console.log(`Created pay_on_site booking ${booking.id} for reservation ${reservationId}`)

    // ── 6. Mark session as booked ──
    if (reservation.session_id) {
      await (supabase.from('experience_sessions') as any)
        .update({
          session_status: 'booked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.session_id)
    }

    // ── 7. Send confirmation emails ──
    const isRental = experience.pricing_type === 'per_day'
    const date = resolveExperienceDate({
      isRental,
      rentalStartDate: reservation.rental_start_date,
      sessionDate: session?.session_date,
      requestedDate: reservation.requested_date,
    })
    const time = session?.start_time || reservation.requested_time || ''
    const rentalEndDate = isRental ? (reservation.rental_end_date || '') : undefined
    const rentalDays = computeRentalDaysFromDates(date || null, rentalEndDate || null)

    const cancellationPolicy = experience.cancellation_policy || 'moderate'
    const cancellationPolicyText = getCancellationPolicyText(cancellationPolicy)

    // Hotel slug for URLs
    let hotelSlug = 'default'
    if (!isDirect && reservation.hotel_id) {
      const { data: hotelConfig } = await supabase
        .from('hotel_configs')
        .select('slug')
        .eq('partner_id', reservation.hotel_id)
        .single()
      hotelSlug = (hotelConfig as any)?.slug || 'default'
    }

    const channelName = isDirect ? 'Veyond' : (reservation.hotel?.name || 'the hotel')

    const guestEmailHtml = guestReservationConfirmedPayOnSite({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      bookingId: booking.id,
      meetingPoint: experience.meeting_point,
      supplierName: supplier.name,
      supplierEmail: supplier.email,
      cancellationPolicyText,
      ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
    })

    const supplierEmailHtml = supplierNewBookingPayOnSite({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      guestEmail: reservation.guest_email,
      guestPhone: reservation.guest_phone,
      guestCompanyName: reservation.guest_company_name ?? null,
      guestVat: reservation.guest_vat ?? null,
      invoiceRequested: reservation.invoice_requested ?? false,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      bookingId: booking.id,
      hotelName: channelName,
      meetingPoint: experience.meeting_point,
      ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
    })

    const emailBatch = [
      {
        to: reservation.guest_email,
        subject: `Reservation confirmed! - ${experience.title}`,
        html: guestEmailHtml,
      },
      {
        to: supplier.email,
        subject: `New booking confirmed - ${experience.title}`,
        html: supplierEmailHtml,
        replyTo: reservation.guest_email,
      },
    ]

    // Hotel notification (if booked via hotel channel)
    let hotelEmail: string | null = reservation.hotel?.email ?? null
    if (!hotelEmail && reservation.hotel_id) {
      const { data: hotelPartner } = await supabase
        .from('partners')
        .select('email')
        .eq('id', reservation.hotel_id)
        .single()
      hotelEmail = (hotelPartner as { email?: string } | null)?.email ?? null
    }

    if (!isDirect && hotelEmail) {
      const hotelEmailHtml = hotelBookingNotification({
        experienceTitle: experience.title,
        supplierName: supplier.name,
        guestName: reservation.guest_name,
        date,
        time,
        participants: reservation.participants,
        totalCents: reservation.total_cents,
        hotelCommissionCents: split.hotelAmount,
        currency: experience.currency,
        bookingId: booking.id,
        ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
      })
      emailBatch.push({
        to: hotelEmail,
        subject: `New booking - ${experience.title}`,
        html: hotelEmailHtml,
      })
    }

    const batchResult = await sendBatchEmails(emailBatch)
    if (!batchResult.success) {
      console.error('Failed to send pay_on_site confirmation emails:', batchResult.error)
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    })
  } catch (error) {
    console.error('Confirm guarantee error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
