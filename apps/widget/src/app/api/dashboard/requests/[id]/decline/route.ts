import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestRequestDeclined } from '@/lib/email/templates'
import type { Database } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    // Parse optional message from body
    let supplierMessage: string | undefined
    try {
      const body = await request.json()
      supplierMessage = body.message || undefined
    } catch {
      // No body or invalid JSON is fine – message is optional
    }

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

    // Get reservation with experience
    const { data: reservationData } = await supabase
      .from('reservations')
      .select(`
        *,
        experience:experiences(
          id, title, slug, currency,
          supplier:partners!experiences_partner_fk(id, email)
        )
      `)
      .eq('id', id)
      .single()

    if (!reservationData) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservation = reservationData as any
    const experience = reservation.experience
    const supplier = experience.supplier

    // Verify the authenticated user owns the supplier partner
    const { data: userPartner } = await supabase
      .from('user_partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('partner_id', supplier.id)
      .single()

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

    // Update reservation status
    await (supabase.from('reservations') as any)
      .update({
        reservation_status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservation.id)

    const date = reservation.requested_date || ''
    const time = reservation.requested_time || null
    const appUrl = getAppUrl()

    // Build experience URL for the "Browse Sessions" CTA
    // Find hotel config for the URL
    const { data: hotelConfig } = await supabase
      .from('hotel_configs')
      .select('slug')
      .eq('partner_id', reservation.hotel_id)
      .single()

    const hotelSlug = (hotelConfig as any)?.slug || 'default'
    const experienceUrl = `${appUrl}/${hotelSlug}/${experience.slug || experience.id}`

    // Send decline email to guest with Browse Sessions CTA
    const emailHtml = guestRequestDeclined({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
      experienceUrl,
      supplierMessage,
    })

    await sendEmail({
      to: reservation.guest_email,
      subject: `Booking update - ${experience.title}`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dashboard decline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
