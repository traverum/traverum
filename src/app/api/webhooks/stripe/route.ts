import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/stripe'
import { calculateCommissionSplit } from '@/lib/commission'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestPaymentConfirmed, supplierBookingConfirmed } from '@/lib/email/templates'
import { generateCancelToken } from '@/lib/tokens'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }
  
  let event: Stripe.Event
  
  try {
    event = verifyWebhookSignature(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
      break
    
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
      break
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
  
  return NextResponse.json({ received: true })
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const reservationId = paymentIntent.metadata?.reservationId
  
  if (!reservationId) {
    console.error('No reservationId in payment intent metadata')
    return
  }
  
  await createBookingFromPayment(reservationId, paymentIntent.id, paymentIntent.latest_charge as string)
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const reservationId = session.metadata?.reservationId
  
  if (!reservationId) {
    console.error('No reservationId in checkout session metadata')
    return
  }
  
  // Get payment intent ID from session
  const paymentIntentId = session.payment_intent as string
  
  if (paymentIntentId) {
    // Import Stripe to get charge ID
    const { stripe } = await import('@/lib/stripe')
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const chargeId = paymentIntent.latest_charge as string
    
    await createBookingFromPayment(reservationId, paymentIntentId, chargeId)
  }
}

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
    console.error('Failed to create booking:', bookingError)
    return
  }
  
  // Update session spots if session-based booking
  if (reservation.session_id) {
    await (supabase
      .from('experience_sessions') as any)
      .update({
        spots_available: session.spots_available - reservation.participants,
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
  const date = session?.session_date || reservation.requested_date || ''
  const time = session?.start_time || reservation.requested_time || ''
  
  // Generate cancel token
  const cancelToken = generateCancelToken(booking.id, new Date(date))
  const cancelUrl = `${appUrl}/api/bookings/${booking.id}/cancel?token=${cancelToken}`
  
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
  })
  
  await sendEmail({
    to: supplier.email,
    subject: `Payment received - ${experience.title}`,
    html: supplierEmailHtml,
    replyTo: reservation.guest_email,
  })
  
  console.log(`Booking ${booking.id} created for reservation ${reservationId}`)
}
