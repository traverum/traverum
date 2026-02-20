import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { createPaymentLink } from '@/lib/stripe'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestBookingApproved } from '@/lib/email/templates'
import { addHours } from 'date-fns'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Shared accept logic - returns { success: true } or { error: string }
async function processAccept(id: string, token: string): Promise<{ success: boolean; error?: string }> {
  const payload = verifyToken(token)
  
  if (!payload) {
    return { success: false, error: 'Invalid or expired token' }
  }
  
  if (payload.id !== id || (payload.action !== 'accept' && payload.action !== 'manage')) {
    return { success: false, error: 'Invalid token' }
  }

  // Use token's id (verified) - URL id can be mangled by some email clients
  const reservationId = payload.id
  const supabase = createAdminClient()
  const appUrl = getAppUrl()

  // Get reservation with related data (use simpler query - complex joins can fail with wrong FK names)
  let reservationData: any = null
  let reservation: any = null

  const { data: fullData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(*, supplier:partners!experiences_partner_fk(*)),
      session:experience_sessions(*),
      hotel:partners!reservations_hotel_fk(*)
    `)
    .eq('id', reservationId)
    .single()

  if (fullData) {
    reservationData = fullData
  } else {
    // Fallback: fetch reservation only, then experience/hotel separately
    const { data: res } = await supabase.from('reservations').select('*').eq('id', reservationId).single() as { data: any }
    if (res) {
      const { data: exp } = await supabase
        .from('experiences')
        .select('*, supplier:partners(*)')
        .eq('id', res.experience_id)
        .single()
      const { data: hotel } = await supabase.from('partners').select('*').eq('id', res.hotel_id).single()
      const { data: session } = res.session_id
        ? await supabase.from('experience_sessions').select('*').eq('id', res.session_id).single()
        : { data: null }
      reservationData = {
        ...res,
        experience: exp,
        session: session ?? null,
        hotel,
      }
    }
  }

  if (!reservationData) {
    console.error('[accept] Reservation not found:', { reservationId })
    return {
      success: false,
      error:
        'Reservation not found. The request may have expired, or the link may point to a different environment. Try using your dashboard to manage requests.',
    }
  }

  reservation = reservationData as any

  if (!reservation.experience || !reservation.experience.supplier) {
    console.error('[accept] Missing experience/supplier:', { reservationId })
    return { success: false, error: 'Reservation data is incomplete. Please contact support.' }
  }

  // Check if already processed
  if (reservation.reservation_status !== 'pending') {
    return { success: false, error: `This booking has already been ${reservation.reservation_status}.` }
  }
  
  const experience = reservation.experience
  const supplier = experience.supplier
  
  // Check if supplier has Stripe onboarding complete
  if (!supplier.stripe_onboarding_complete) {
    return { success: false, error: 'You need to complete Stripe onboarding before accepting bookings. Please contact support.' }
  }
  
  // Get hotel config for redirect URL
  const { data: hotelConfig } = await supabase
    .from('hotel_configs')
    .select('slug')
    .eq('partner_id', reservation.hotel_id)
    .single()
  
  const hotelSlug = (hotelConfig as any)?.slug || 'default'
  
  const isRental = experience.pricing_type === 'per_day'

  // For non-rental requests: we need both date and time
  if (reservation.is_request && !isRental && (!reservation.requested_date || !reservation.requested_time)) {
    return {
      success: false,
      error: 'This request has no specific time. Please decline and suggest alternative times from your dashboard.',
    }
  }

  // For rental requests: we only need the requested_date (no time needed)
  if (reservation.is_request && isRental && !reservation.requested_date) {
    return {
      success: false,
      error: 'This rental request has no start date. Please decline and ask the guest to resubmit.',
    }
  }
  
  // If this is a non-rental request without a session, create one
  let sessionId = reservation.session_id
  
  if (reservation.is_request && !isRental && !sessionId && reservation.requested_date && reservation.requested_time) {
    const { data: newSession, error: sessionError } = await (supabase
      .from('experience_sessions') as any)
      .insert({
        experience_id: experience.id,
        session_date: reservation.requested_date,
        start_time: reservation.requested_time,
        spots_total: experience.max_participants,
        spots_available: 0,
        session_status: 'booked',
      })
      .select()
      .single()
    
    if (sessionError || !newSession) {
      console.error('Failed to create session:', sessionError)
      return { success: false, error: 'Failed to create session for this booking.' }
    }
    
    sessionId = newSession.id
    console.log(`Created private session ${sessionId} for ${reservation.requested_date} at ${reservation.requested_time}`)
    
    await (supabase
      .from('reservations') as any)
      .update({ 
        session_id: sessionId, 
        updated_at: new Date().toISOString() 
      })
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
  
  await (supabase
    .from('reservations') as any)
    .update({
      reservation_status: 'approved',
      payment_deadline: paymentDeadline.toISOString(),
      stripe_payment_link_id: paymentLink.id,
      stripe_payment_link_url: paymentLink.url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservation.id)
  
  // Get date and time — rentals don't have a time
  const date = isRental
    ? (reservation.rental_start_date || reservation.requested_date || '')
    : (reservation.session?.session_date || reservation.requested_date || '')
  const time = isRental ? '' : (reservation.session?.start_time || reservation.requested_time || '')

  // Compute rental days for email
  let emailRentalDays: number | undefined
  let emailRentalEndDate: string | undefined
  if (isRental && reservation.rental_start_date && reservation.rental_end_date) {
    emailRentalEndDate = reservation.rental_end_date
    emailRentalDays = Math.max(1, Math.round(
      (new Date(reservation.rental_end_date + 'T12:00:00').getTime() - new Date(reservation.rental_start_date + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)
    ))
  }
  
  // Send email to guest
  const emailHtml = guestBookingApproved({
    experienceTitle: experience.title,
    guestName: reservation.guest_name,
    date,
    time,
    participants: reservation.participants,
    totalCents: reservation.total_cents,
    currency: experience.currency,
    paymentUrl: paymentLink.url!,
    meetingPoint: experience.meeting_point,
    paymentDeadline: paymentDeadline.toISOString(),
    ...(isRental ? { rentalEndDate: emailRentalEndDate, rentalDays: emailRentalDays } : {}),
  })
  
  await sendEmail({
    to: reservation.guest_email,
    subject: `Your booking is approved! Complete payment - ${experience.title}`,
    html: emailHtml,
  })
  
  return { success: true }
}

// GET: One-click accept from email (returns HTML)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return new NextResponse(generateErrorHtml('Error', 'Missing token'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }
  
  try {
    const result = await processAccept(id, token)
    
    if (result.success) {
      return new NextResponse(
        generateSuccessHtml('Booking Accepted', 'The guest has been notified and sent a payment link.'),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    } else {
      return new NextResponse(
        generateErrorHtml('Error', result.error || 'Failed to process.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      )
    }
  } catch (error) {
    console.error('Accept reservation error:', error)
    return new NextResponse(
      generateErrorHtml('Error', 'Failed to process acceptance. Please try again.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// POST: Accept from manage page (returns JSON)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  try {
    const body = await request.json().catch(() => ({}))
    const token: string | undefined = body.token
    
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }
    
    const result = await processAccept(id, token)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Accept reservation POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateSuccessHtml(title: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Finlandica:wght@300;500&display=swap');
        body { font-family: 'Finlandica', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F4EFE6; }
        .card { background: #FEFCF9; padding: 48px; border-radius: 6px; text-align: center; max-width: 400px; border: 1px solid rgba(55, 53, 47, 0.09); }
        .icon { width: 64px; height: 64px; background: rgba(107, 142, 107, 0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #6B8E6B; }
        h1 { margin: 0 0 12px; font-size: 22px; font-weight: 300; color: #5D4631; }
        p { margin: 0; color: rgba(55, 53, 47, 0.7); font-weight: 300; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}

function generateErrorHtml(title: string, message: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Finlandica:wght@300;500&display=swap');
        body { font-family: 'Finlandica', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F4EFE6; }
        .card { background: #FEFCF9; padding: 48px; border-radius: 6px; text-align: center; max-width: 400px; border: 1px solid rgba(55, 53, 47, 0.09); }
        .icon { width: 64px; height: 64px; background: rgba(184, 134, 107, 0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #B8866B; }
        h1 { margin: 0 0 12px; font-size: 22px; font-weight: 300; color: #5D4631; }
        p { margin: 0; color: rgba(55, 53, 47, 0.7); font-weight: 300; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}
