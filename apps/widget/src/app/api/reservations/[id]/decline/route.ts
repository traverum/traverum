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

// GET: No one-click decline — redirect to respond page so supplier can optionally add a message/propose times
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const appUrl = getAppUrl()
  const respondUrl = `${appUrl}/request/${id}/respond${token ? `?dt=${encodeURIComponent(token)}` : ''}`
  return NextResponse.redirect(respondUrl, 302)
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;500&display=swap');
        body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F4EFE6; }
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;500&display=swap');
        body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F4EFE6; }
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
