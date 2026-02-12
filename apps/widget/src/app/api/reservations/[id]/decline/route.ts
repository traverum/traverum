import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestRequestDeclined } from '@/lib/email/templates'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Shared decline logic
async function processDecline(
  id: string,
  token: string,
  supplierMessage?: string
): Promise<{ success: boolean; error?: string }> {
  const payload = verifyToken(token)
  
  if (!payload) {
    return { success: false, error: 'Invalid or expired token' }
  }
  
  if (payload.id !== id || (payload.action !== 'decline' && payload.action !== 'manage')) {
    return { success: false, error: 'Invalid token' }
  }
  
  const supabase = createAdminClient()
  const appUrl = getAppUrl()
  
  // Get reservation with experience
  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, slug, currency),
      session:experience_sessions(session_date, start_time)
    `)
    .eq('id', id)
    .single()
  
  if (!reservationData) {
    return { success: false, error: 'Reservation not found' }
  }
  
  const reservation = reservationData as any
  
  // Check if already processed
  if (reservation.reservation_status !== 'pending') {
    return { success: false, error: `This booking has already been ${reservation.reservation_status}.` }
  }
  
  // Update reservation status
  await (supabase
    .from('reservations') as any)
    .update({
      reservation_status: 'declined',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservation.id)
  
  const experience = reservation.experience as any
  const date = reservation.session?.session_date || reservation.requested_date || ''
  const time = reservation.session?.start_time || reservation.requested_time || null

  // Build experience URL for "View Sessions" CTA (always provide so guest can browse alternatives)
  const { data: hotelConfig } = await supabase
    .from('hotel_configs')
    .select('slug')
    .eq('partner_id', reservation.hotel_id)
    .single()

  const hotelSlug = (hotelConfig as any)?.slug || 'default'
  const expSlug = experience?.slug || reservation.experience_id
  const experienceUrl = `${appUrl}/${hotelSlug}/${expSlug}`
  
  // Send email to guest
  const emailHtml = guestRequestDeclined({
    experienceTitle: experience.title,
    guestName: reservation.guest_name,
    date,
    time,
    participants: reservation.participants,
    totalCents: reservation.total_cents,
    currency: experience.currency,
    experienceUrl,
    supplierMessage: supplierMessage || undefined,
  })
  
  await sendEmail({
    to: reservation.guest_email,
    subject: `Booking update - ${experience.title}`,
    html: emailHtml,
  })
  
  return { success: true }
}

// GET: One-click decline from email (returns HTML)
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
    const result = await processDecline(id, token)
    
    if (result.success) {
      return new NextResponse(
        generateSuccessHtml('Booking Declined', 'The guest has been notified that this time is not available.'),
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      )
    } else {
      return new NextResponse(
        generateErrorHtml('Error', result.error || 'Failed to process.'),
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      )
    }
  } catch (error) {
    console.error('Decline reservation error:', error)
    return new NextResponse(
      generateErrorHtml('Error', 'Failed to process. Please try again.'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// POST: Decline from manage page with optional message (returns JSON)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  
  try {
    const body = await request.json().catch(() => ({}))
    const token: string | undefined = body.token
    const message: string | undefined = body.message
    
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }
    
    const result = await processDecline(id, token, message)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Decline reservation POST error:', error)
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 48px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .icon { width: 64px; height: 64px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #6b7280; }
        h1 { margin: 0 0 12px; font-size: 24px; color: #111; }
        p { margin: 0; color: #666; }
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 48px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .icon { width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #dc2626; }
        h1 { margin: 0 0 12px; font-size: 24px; color: #111; }
        p { margin: 0; color: #666; }
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
