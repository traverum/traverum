import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe, createStripeCustomer } from '@/lib/stripe'
import { PAYMENT_MODES } from '@traverum/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/reservations/[id]/setup-intent
 *
 * Creates a Stripe Customer + Setup Intent for a request-based pay_on_site
 * reservation that has been approved by the supplier. The guest lands on the
 * guarantee page (linked from the acceptance email) and this endpoint is
 * called when they submit their card.
 *
 * Returns { clientSecret } for use with stripe.confirmSetup() on the client.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: reservationId } = await params

  try {
    const supabase = createAdminClient()

    const { data: reservationData } = await supabase
      .from('reservations')
      .select(`
        *,
        experience:experiences(
          *,
          supplier:partners!experiences_partner_fk(*)
        )
      `)
      .eq('id', reservationId)
      .single()

    if (!reservationData) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservation = reservationData as any
    const experience = reservation.experience
    const supplier = experience?.supplier

    if (!experience || !supplier) {
      return NextResponse.json({ error: 'Reservation data is incomplete' }, { status: 400 })
    }

    // Must be approved (supplier accepted) and pay_on_site
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

    // No booking should exist yet
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('reservation_id', reservationId)
      .single()

    if (existingBooking) {
      return NextResponse.json(
        { error: 'A booking already exists for this reservation' },
        { status: 400 }
      )
    }

    // Idempotent: if Setup Intent already exists, check its state
    if (reservation.stripe_setup_intent_id) {
      const existingSI = await stripe.setupIntents.retrieve(reservation.stripe_setup_intent_id)

      if (existingSI.status === 'succeeded') {
        // Card already saved (previous attempt confirmed but booking creation failed).
        // Tell the client to skip stripe.confirmSetup() and proceed to confirm-guarantee.
        return NextResponse.json({
          success: true,
          alreadyConfirmed: true,
          stripeCustomerId: reservation.stripe_customer_id,
        })
      }

      if (existingSI.status === 'requires_payment_method' || existingSI.status === 'requires_confirmation') {
        return NextResponse.json({
          success: true,
          clientSecret: existingSI.client_secret,
          stripeCustomerId: reservation.stripe_customer_id,
        })
      }

      // Status is canceled/processing/other — create a fresh Setup Intent below
      // (use a timestamped key so Stripe doesn't return the stale one)
    }

    // Create Stripe Customer (idempotent per reservation)
    const customer = await createStripeCustomer(
      reservation.guest_email,
      reservation.guest_name,
      reservationId
    )

    // Create Setup Intent — use a timestamped key when replacing a stale one
    const idempotencyKey = reservation.stripe_setup_intent_id
      ? `setup_${reservationId}_${Date.now()}`
      : `setup_${reservationId}`
    const setupIntent = await stripe.setupIntents.create(
      {
        customer: customer.id,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: { reservationId },
      },
      { idempotencyKey }
    )

    // Store on reservation
    await (supabase.from('reservations') as any)
      .update({
        stripe_customer_id: customer.id,
        stripe_setup_intent_id: setupIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      stripeCustomerId: customer.id,
    })
  } catch (error) {
    console.error('Setup intent creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
