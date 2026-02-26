import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { calculateCommissionSplit } from '@/lib/commission'
import { sendEmail, sendBatchEmails, getAppUrl } from '@/lib/email/index'
import { 
  guestPaymentConfirmed, 
  supplierBookingConfirmed,
  hotelBookingNotification,
} from '@/lib/email/templates'
import { generateCancelToken } from '@/lib/tokens'
import { getCancellationPolicyText, CANCELLATION_POLICIES } from '@/lib/availability'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) return true // Allow if no secret configured (dev)
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * Manual booking creation endpoint for debugging
 * Use this to manually create a booking from a payment that succeeded
 * but didn't trigger the webhook properly
 * 
 * Requires CRON_SECRET bearer token authentication.
 * 
 * Usage: POST /api/bookings/manual-create
 * Headers: { Authorization: "Bearer <CRON_SECRET>" }
 * Body: { paymentIntentId: "pi_xxx" } or { reservationId: "xxx" }
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { paymentIntentId, reservationId, chargeId } = body

    if (!paymentIntentId && !reservationId) {
      return NextResponse.json(
        { error: 'Either paymentIntentId or reservationId is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // If paymentIntentId provided, find reservation from payment intent
    let finalReservationId = reservationId
    let finalPaymentIntentId = paymentIntentId
    let finalChargeId = chargeId

    if (paymentIntentId && !reservationId) {
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      finalReservationId = paymentIntent.metadata?.reservationId
      finalChargeId = paymentIntent.latest_charge as string

      if (!finalReservationId) {
        // Try to find by payment link
        const { data: reservations } = await supabase
          .from('reservations')
          .select('id, stripe_payment_link_id')
          .not('stripe_payment_link_id', 'is', null)

        // Check each payment link to see if it matches
        const reservationsList = (reservations || []) as Array<{ id: string; stripe_payment_link_id: string | null }>
        for (const res of reservationsList) {
          if (!res.stripe_payment_link_id) continue
          try {
            const paymentLink = await stripe.paymentLinks.retrieve(
              res.stripe_payment_link_id
            )
            // Check if this payment link's sessions match
            // This is a simplified check - in production you'd want to check sessions
            if (paymentLink.metadata?.reservationId === res.id) {
              // This is a heuristic - we'd need to check actual sessions
              console.log('Found potential match:', res.id)
            }
          } catch (e) {
            // Skip
          }
        }

        return NextResponse.json(
          { 
            error: 'Could not find reservationId from payment intent',
            paymentIntent: {
              id: paymentIntent.id,
              metadata: paymentIntent.metadata,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
            }
          },
          { status: 400 }
        )
      }
    }

    if (!finalReservationId) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      )
    }

    // Check if booking already exists
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('reservation_id', finalReservationId)
      .single()

    if (existingBooking) {
      return NextResponse.json({
        message: 'Booking already exists',
        bookingId: (existingBooking as any).id,
      })
    }

    // Get reservation with all related data
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
      .eq('id', finalReservationId)
      .single()

    if (!reservationData) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    const reservation = reservationData as any
    const experience = reservation.experience
    const supplier = experience.supplier
    const session = reservation.session

    // Get distribution for commission rates
    const { data: distributionData } = await supabase
      .from('distributions')
      .select('*')
      .eq('experience_id', experience.id)
      .eq('hotel_id', reservation.hotel_id)
      .eq('is_active', true)
      .single()

    if (!distributionData) {
      return NextResponse.json(
        { error: 'Distribution not found for experience and hotel' },
        { status: 404 }
      )
    }

    const distribution = distributionData as any

    // Calculate commission split
    const split = calculateCommissionSplit(reservation.total_cents, distribution)

    // Get payment intent if not provided
    if (!finalPaymentIntentId) {
      // Try to find from reservation's payment link
      if (reservation.stripe_payment_link_id) {
        // This is complex - would need to list sessions
        // For now, require paymentIntentId
        return NextResponse.json(
          { error: 'paymentIntentId required when not found in reservation' },
          { status: 400 }
        )
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await (supabase
      .from('bookings') as any)
      .insert({
        reservation_id: finalReservationId,
        session_id: reservation.session_id || session?.id,
        amount_cents: reservation.total_cents,
        supplier_amount_cents: split.supplierAmount,
        hotel_amount_cents: split.hotelAmount,
        platform_amount_cents: split.platformAmount,
        stripe_payment_intent_id: finalPaymentIntentId || null,
        stripe_charge_id: finalChargeId || null,
        booking_status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('Failed to create booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError },
        { status: 500 }
      )
    }

    // Update reservation status
    await (supabase
      .from('reservations') as any)
      .update({
        reservation_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', finalReservationId)

    // Mark session as booked if session-based booking
    if (reservation.session_id) {
      await (supabase
        .from('experience_sessions') as any)
        .update({
          session_status: 'booked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.session_id)
    }

    // Get hotel config for URLs
    const { data: hotelConfig } = await supabase
      .from('hotel_configs')
      .select('slug')
      .eq('partner_id', reservation.hotel_id)
      .single()

    const hotelSlug = (hotelConfig as any)?.slug || 'default'
    const isRental = experience.pricing_type === 'per_day'
    const date = isRental && reservation.rental_start_date
      ? reservation.rental_start_date
      : (session?.session_date || reservation.requested_date || '')
    const time = session?.start_time || reservation.requested_time || ''
    const rentalEndDate = isRental ? (reservation.rental_end_date || '') : undefined
    // rental_end_date is inclusive (last day). Duration = diff + 1.
    const rentalDays = rentalEndDate && date
      ? Math.max(1, Math.round((new Date(rentalEndDate + 'T12:00:00').getTime() - new Date(date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : undefined

    // Generate cancel token; link goes to confirmation page first ("are you sure?")
    const cancelToken = generateCancelToken(booking.id, new Date(date))
    const appUrl = getAppUrl()
    const cancelUrl = `${appUrl}/booking/cancel?id=${booking.id}&token=${encodeURIComponent(cancelToken)}`

    const cancellationPolicy = experience.cancellation_policy || 'moderate'
    const minDays = CANCELLATION_POLICIES.find((p) => p.value === cancellationPolicy)?.minDaysBeforeCancel ?? 0
    const cancellationPolicyText = getCancellationPolicyText(cancellationPolicy, experience.force_majeure_refund)
    const allowCancel = minDays > 0

    const rentalEmailExtras = isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}

    // Build all confirmation emails and send as a single batch to avoid rate limits
    const guestEmailHtml = guestPaymentConfirmed({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      bookingId: booking.id,
      meetingPoint: experience.meeting_point,
      cancelUrl,
      supplierName: supplier.name,
      supplierEmail: supplier.email,
      cancellationPolicyText,
      allowCancel,
      ...rentalEmailExtras,
    })

    const supplierEmailHtml = supplierBookingConfirmed({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      guestEmail: reservation.guest_email,
      guestPhone: reservation.guest_phone,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      bookingId: booking.id,
      meetingPoint: experience.meeting_point,
      ...rentalEmailExtras,
    })

    // Resolve hotel email from nested relation or fetch by hotel_id
    let hotelEmail: string | null = reservation.hotel?.email ?? null
    if (!hotelEmail && reservation.hotel_id) {
      const { data: hotelPartner } = await supabase
        .from('partners')
        .select('email')
        .eq('id', reservation.hotel_id)
        .single()
      hotelEmail = (hotelPartner as { email?: string } | null)?.email ?? null
    }

    const emailBatch = [
      { to: reservation.guest_email, subject: `Booking confirmed! - ${experience.title}`, html: guestEmailHtml },
      { to: supplier.email, subject: `Payment received - ${experience.title}`, html: supplierEmailHtml, replyTo: reservation.guest_email },
    ]

    if (hotelEmail) {
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
        ...rentalEmailExtras,
      })
      emailBatch.push({ to: hotelEmail, subject: `New booking - ${experience.title}`, html: hotelEmailHtml })
    } else {
      console.warn(`Booking ${booking.id}: no hotel email (hotel_id=${reservation.hotel_id}) — hotel notification skipped`)
    }

    const batchResult = await sendBatchEmails(emailBatch)
    if (!batchResult.success) {
      console.error('Failed to send booking confirmation emails:', batchResult.error)
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      message: 'Booking created successfully',
    })
  } catch (error: any) {
    console.error('Manual booking creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
