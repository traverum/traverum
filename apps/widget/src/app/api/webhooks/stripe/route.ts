import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature, stripe } from '@/lib/stripe'
import { calculateCommissionSplit } from '@/lib/commission'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { 
  guestPaymentConfirmed, 
  supplierBookingConfirmed,
  hotelBookingNotification,
  guestPaymentFailed,
  guestRefundProcessed,
  supplierPayoutSent,
  adminAccountStatusChanged
} from '@/lib/email/templates'
import { generateCancelToken } from '@/lib/tokens'
import { getCancellationPolicyText, CANCELLATION_POLICIES } from '@/lib/availability'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    console.error('Webhook request missing signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }
  
  let event: Stripe.Event
  
  try {
    event = verifyWebhookSignature(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  console.log(`Processing webhook event: ${event.type}`, {
    eventId: event.id,
    objectId: (event.data.object as any)?.id,
  })
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
      break
    
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
      break
    
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
      break
    
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object as Stripe.Charge)
      break
    
    case 'account.updated':
      await handleAccountUpdated(event.data.object as Stripe.Account)
      break
    
    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer)
      break
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
  
  return NextResponse.json({ received: true })
}

// ============================================================================
// payment_intent.succeeded - Guest payment successful
// ============================================================================
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', {
    paymentIntentId: paymentIntent.id,
    metadata: paymentIntent.metadata,
  })
  
  let reservationId = paymentIntent.metadata?.reservationId
  
  // If metadata not on payment intent, try to find via charge or other means
  if (!reservationId) {
    console.log('No reservationId in payment intent metadata, attempting fallback lookup')
    
    // Try to find reservation by searching for payment links that might match
    // This is a fallback - ideally metadata should be present
    try {
      const supabase = createAdminClient()
      // Note: This is a fallback - we'd need to store payment link -> payment intent mapping
      // For now, log the issue so we can investigate
      console.error('Payment intent missing reservationId metadata', {
        paymentIntentId: paymentIntent.id,
        chargeId: paymentIntent.latest_charge,
      })
    } catch (error) {
      console.error('Error in fallback lookup:', error)
    }
  }
  
  if (!reservationId) {
    console.error('No reservationId found for payment intent:', paymentIntent.id)
    return
  }
  
  await createBookingFromPayment(reservationId, paymentIntent.id, paymentIntent.latest_charge as string)
}

// ============================================================================
// checkout.session.completed - Checkout session completed
// ============================================================================
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', {
    sessionId: session.id,
    paymentIntentId: session.payment_intent,
    paymentLink: session.payment_link,
    metadata: session.metadata,
  })
  
  let reservationId = session.metadata?.reservationId
  
  // If metadata not on session, try to get it from payment intent
  if (!reservationId && session.payment_intent) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string,
        { expand: ['latest_charge'] }
      )
      reservationId = paymentIntent.metadata?.reservationId
      console.log('Retrieved reservationId from payment intent:', reservationId)
    } catch (error) {
      console.error('Error retrieving payment intent:', error)
    }
  }
  
  // If still no reservationId, try to find it via payment link
  if (!reservationId && session.payment_link) {
    try {
      const supabase = createAdminClient()
      const { data: reservation } = await supabase
        .from('reservations')
        .select('id')
        .eq('stripe_payment_link_id', session.payment_link)
        .single()
      
      if (reservation) {
        reservationId = (reservation as any).id
        console.log('Retrieved reservationId from payment link:', reservationId)
      }
    } catch (error) {
      console.error('Error finding reservation by payment link:', error)
    }
  }
  
  if (!reservationId) {
    console.error('No reservationId found in checkout session', {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      paymentLink: session.payment_link,
      sessionMetadata: session.metadata,
    })
    return
  }
  
  // Get payment intent ID from session
  const paymentIntentId = session.payment_intent as string
  
  if (paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      const chargeId = paymentIntent.latest_charge as string
      
      await createBookingFromPayment(reservationId, paymentIntentId, chargeId)
    } catch (error) {
      console.error('Error processing checkout completion:', error)
    }
  } else {
    console.error('No payment_intent in checkout session:', session.id)
  }
}

// ============================================================================
// payment_intent.payment_failed - Payment failed
// ============================================================================
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const reservationId = paymentIntent.metadata?.reservationId
  
  if (!reservationId) {
    console.error('No reservationId in failed payment intent metadata')
    return
  }
  
  const supabase = createAdminClient()
  
  // Get reservation with related data
  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(*),
      session:experience_sessions(*)
    `)
    .eq('id', reservationId)
    .single()
  
  if (!reservationData) {
    console.error(`Reservation ${reservationId} not found for failed payment`)
    return
  }
  
  const reservation = reservationData as any
  const experience = reservation.experience
  const session = reservation.session
  
  // Release session — set back to available
  if (reservation.session_id) {
    await (supabase
      .from('experience_sessions') as any)
      .update({
        session_status: 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.session_id)
    
    console.log(`Released session ${reservation.session_id} due to payment failure`)
  }
  
  // Get error message from the payment intent
  const lastError = paymentIntent.last_payment_error
  const errorMessage = lastError?.message || 'Payment was declined'
  
  // Send payment failed email to guest
  const guestEmailHtml = guestPaymentFailed({
    experienceTitle: experience.title,
    guestName: reservation.guest_name,
    date: session?.session_date || reservation.requested_date || '',
    time: session?.start_time || reservation.requested_time || '',
    participants: reservation.participants,
    totalCents: reservation.total_cents,
    currency: experience.currency,
    paymentUrl: reservation.stripe_payment_link_url || '',
    errorMessage,
  })
  
  await sendEmail({
    to: reservation.guest_email,
    subject: `Payment failed - ${experience.title}`,
    html: guestEmailHtml,
  })
  
  console.log(`Payment failed notification sent for reservation ${reservationId}`)
}

// ============================================================================
// charge.refunded - Refund processed
// ============================================================================
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createAdminClient()
  
  // Find booking by charge ID
  const { data: bookingData } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(*),
        session:experience_sessions(*)
      )
    `)
    .eq('stripe_charge_id', charge.id)
    .single()
  
  if (!bookingData) {
    console.log(`No booking found for charge ${charge.id} - may be from external refund`)
    return
  }
  
  const booking = bookingData as any
  const reservation = booking.reservation
  const experience = reservation?.experience
  
  // Get the refund ID from the charge's refunds
  const refundId = charge.refunds?.data?.[0]?.id || null
  const refundAmount = charge.amount_refunded
  
  // Update booking with refund ID if not already cancelled
  if (booking.booking_status !== 'cancelled') {
    await (supabase
      .from('bookings') as any)
      .update({
        stripe_refund_id: refundId,
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
    
    // Release session — set back to available
    if (booking.session_id) {
      await (supabase
        .from('experience_sessions') as any)
        .update({
          session_status: 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.session_id)
    }
  } else {
    // Just update the refund ID for audit trail
    await (supabase
      .from('bookings') as any)
      .update({
        stripe_refund_id: refundId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
  }
  
  // Send refund confirmation email to guest
  if (reservation && experience) {
    const guestEmailHtml = guestRefundProcessed({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date: reservation.session?.session_date || reservation.requested_date || '',
      time: reservation.session?.start_time || reservation.requested_time || '',
      participants: reservation.participants,
      totalCents: booking.amount_cents,
      currency: experience.currency,
      bookingId: booking.id,
      refundAmount,
    })
    
    await sendEmail({
      to: reservation.guest_email,
      subject: `Refund processed - ${experience.title}`,
      html: guestEmailHtml,
    })
  }
  
  console.log(`Refund processed for booking ${booking.id}, refund ID: ${refundId}`)
}

// ============================================================================
// account.updated - Connected account status changed
// ============================================================================
async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createAdminClient()
  
  // Find partner by Stripe account ID
  const { data: partnerData } = await supabase
    .from('partners')
    .select('*')
    .eq('stripe_account_id', account.id)
    .single()
  
  if (!partnerData) {
    console.log(`No partner found for Stripe account ${account.id}`)
    return
  }
  
  const partner = partnerData as any
  
  // Check if onboarding is complete
  const chargesEnabled = account.charges_enabled || false
  const payoutsEnabled = account.payouts_enabled || false
  const detailsSubmitted = account.details_submitted || false
  const isOnboardingComplete = chargesEnabled && payoutsEnabled && detailsSubmitted
  
  // Update partner record if onboarding status changed
  if (partner.stripe_onboarding_complete !== isOnboardingComplete) {
    await (supabase
      .from('partners') as any)
      .update({
        stripe_onboarding_complete: isOnboardingComplete,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id)
    
    console.log(`Partner ${partner.id} onboarding status updated to: ${isOnboardingComplete}`)
    
    // Send admin notification email about status change
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const adminEmailHtml = adminAccountStatusChanged({
        partnerName: partner.name,
        partnerEmail: partner.email,
        partnerType: partner.partner_type,
        stripeAccountId: account.id,
        isOnboardingComplete,
        chargesEnabled,
        payoutsEnabled,
      })
      
      await sendEmail({
        to: adminEmail,
        subject: `Stripe account ${isOnboardingComplete ? 'verified' : 'needs attention'} - ${partner.name}`,
        html: adminEmailHtml,
      })
    }
  }
}

// ============================================================================
// transfer.created - Payout to supplier initiated
// ============================================================================
async function handleTransferCreated(transfer: Stripe.Transfer) {
  const bookingId = transfer.metadata?.bookingId
  
  if (!bookingId) {
    console.log(`No bookingId in transfer metadata for transfer ${transfer.id}`)
    return
  }
  
  const supabase = createAdminClient()
  
  // Get booking with related data
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
    .eq('id', bookingId)
    .single()
  
  if (!bookingData) {
    console.error(`Booking ${bookingId} not found for transfer`)
    return
  }
  
  const booking = bookingData as any
  const reservation = booking.reservation
  const experience = reservation?.experience
  const supplier = experience?.supplier
  const session = reservation?.session
  
  // Update booking with transfer ID if not already set
  if (!booking.stripe_transfer_id) {
    await (supabase
      .from('bookings') as any)
      .update({
        stripe_transfer_id: transfer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
  }
  
  // Send payout notification to supplier
  if (supplier) {
    const supplierEmailHtml = supplierPayoutSent({
      experienceTitle: experience.title,
      bookingId: booking.id,
      guestName: reservation.guest_name,
      date: session?.session_date || reservation.requested_date || '',
      payoutAmount: transfer.amount,
      currency: transfer.currency,
    })
    
    await sendEmail({
      to: supplier.email,
      subject: `Payment sent - ${experience.title}`,
      html: supplierEmailHtml,
    })
  }
  
  console.log(`Transfer notification sent for booking ${bookingId}, transfer ID: ${transfer.id}`)
}

// ============================================================================
// Helper: Create booking from successful payment
// ============================================================================
async function createBookingFromPayment(
  reservationId: string,
  paymentIntentId: string,
  chargeId: string
) {
  const supabase = createAdminClient()
  const appUrl = getAppUrl()
  
  // Check if booking already exists (idempotency)
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('reservation_id', reservationId)
    .single()
  
  if (existingBooking) {
    console.log(`Booking already exists for reservation ${reservationId}`)
    return
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
    .eq('id', reservationId)
    .single()
  
  if (!reservationData) {
    console.error(`Reservation ${reservationId} not found`)
    return
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
    console.error(`Distribution not found for experience ${experience.id} and hotel ${reservation.hotel_id}`)
    return
  }
  
  const distribution = distributionData as any
  
  // Calculate commission split
  const split = calculateCommissionSplit(reservation.total_cents, distribution)
  
  // Create booking
  const { data: booking, error: bookingError } = await (supabase
    .from('bookings') as any)
    .insert({
      reservation_id: reservationId,
      session_id: reservation.session_id || session?.id,
      amount_cents: reservation.total_cents,
      supplier_amount_cents: split.supplierAmount,
      hotel_amount_cents: split.hotelAmount,
      platform_amount_cents: split.platformAmount,
      stripe_payment_intent_id: paymentIntentId,
      stripe_charge_id: chargeId,
      booking_status: 'confirmed',
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (bookingError || !booking) {
    console.error('Failed to create booking:', {
      error: bookingError,
      reservationId,
      paymentIntentId,
      chargeId,
    })
    return
  }
  
  console.log(`Successfully created booking ${booking.id} for reservation ${reservationId}`)
  
  // Update reservation status to approved if it was pending
  await (supabase
    .from('reservations') as any)
    .update({
      reservation_status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
  
  // Note: Session status was already set to 'booked' when reservation was created
  // No further status change needed here
  
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
  
  // Generate cancel token
  const cancelToken = generateCancelToken(booking.id, new Date(date))
  const cancelUrl = `${appUrl}/api/bookings/${booking.id}/cancel?token=${cancelToken}`

  const cancellationPolicy = experience.cancellation_policy || 'moderate'
  const minDays = CANCELLATION_POLICIES.find((p) => p.value === cancellationPolicy)?.minDaysBeforeCancel ?? 0
  const cancellationPolicyText = getCancellationPolicyText(cancellationPolicy, experience.force_majeure_refund)
  const allowCancel = minDays > 0
  
  // Send confirmation email to guest
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
    ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
  })
  
  await sendEmail({
    to: reservation.guest_email,
    subject: `Booking confirmed! - ${experience.title}`,
    html: guestEmailHtml,
  })
  
  // Send confirmation email to supplier
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
    ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
  })
  
  await sendEmail({
    to: supplier.email,
    subject: `Payment received - ${experience.title}`,
    html: supplierEmailHtml,
    replyTo: reservation.guest_email,
  })
  
  // Send notification email to hotel (resolve email from nested relation or fetch by hotel_id)
  let hotelEmail: string | null = reservation.hotel?.email ?? null
  if (!hotelEmail && reservation.hotel_id) {
    const { data: hotelPartner } = await supabase
      .from('partners')
      .select('email')
      .eq('id', reservation.hotel_id)
      .single()
    hotelEmail = (hotelPartner as { email?: string } | null)?.email ?? null
  }
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
      ...(isRental && rentalEndDate ? { rentalEndDate, rentalDays } : {}),
    })

    const sendResult = await sendEmail({
      to: hotelEmail,
      subject: `New booking - ${experience.title}`,
      html: hotelEmailHtml,
    })
    if (!sendResult.success) {
      console.error('Failed to send hotel booking notification:', sendResult.error)
    }
  } else {
    console.warn(`Booking ${booking.id}: no hotel email (hotel_id=${reservation.hotel_id}) — hotel notification skipped`)
  }
  
  console.log(`Booking ${booking.id} created for reservation ${reservationId}`)
}
