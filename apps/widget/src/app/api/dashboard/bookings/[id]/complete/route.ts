import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { createTransfer, stripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
import { baseTemplate } from '@/lib/email/templates'
import { escapeHtml } from '@/lib/sanitize'
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

    const { data: bookingData } = await supabase
      .from('bookings')
      .select(`
        *,
        reservation:reservations(
          *,
          experience:experiences(
            *,
            supplier:partners!experiences_partner_fk(*)
          )
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

    if (booking.booking_status !== 'confirmed') {
      return NextResponse.json(
        { error: `Booking has already been ${booking.booking_status}` },
        { status: 400 }
      )
    }

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

    let transferId = null
    if (supplier.stripe_account_id && booking.supplier_amount_cents > 0) {
      let chargeId = booking.stripe_charge_id

      if (!chargeId && booking.stripe_payment_intent_id) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            booking.stripe_payment_intent_id
          )
          chargeId = paymentIntent.latest_charge as string
        } catch (error) {
          console.error('Failed to retrieve payment intent:', error)
        }
      }

      const transfer = await createTransfer(
        booking.supplier_amount_cents,
        experience.currency,
        supplier.stripe_account_id,
        booking.id,
        chargeId || undefined
      )
      transferId = transfer.id
    }

    await (supabase
      .from('bookings') as any)
      .update({
        booking_status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_transfer_id: transferId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (supplier.email) {
      await sendEmail({
        to: supplier.email,
        subject: `Payment transferred - ${experience.title}`,
        html: baseTemplate(`
          <div class="card">
            <div class="header"><h1>Payment Transferred</h1></div>
            <p>The experience has been marked as completed and your payment has been transferred.</p>
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
                <span class="info-label">Amount Transferred</span>
                <span class="info-value">${new Intl.NumberFormat('fi-FI', { style: 'currency', currency: experience.currency || 'EUR' }).format(booking.supplier_amount_cents / 100)}</span>
              </div>
            </div>
            <p class="text-muted">The funds will arrive in your connected Stripe account within 2-3 business days.</p>
          </div>
        `, 'Payment Transferred'),
      })
    }

    console.log(`Supplier completed booking ${id} via dashboard, transfer initiated`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Dashboard complete booking error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
