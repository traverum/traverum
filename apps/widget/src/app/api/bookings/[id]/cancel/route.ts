import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { createRefund } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
import { differenceInDays, parseISO } from 'date-fns'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  // Verify token
  if (!token) {
    return createResponse('error', 'Missing token')
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    return createResponse('error', 'Invalid or expired token')
  }
  
  if (payload.id !== id || payload.action !== 'cancel') {
    return createResponse('error', 'Invalid token')
  }
  
  const supabase = createAdminClient()
  
  // Get booking with related data
  const { data: bookingData } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(title, currency),
        session:experience_sessions(session_date)
      )
    `)
    .eq('id', id)
    .single()
  
  if (!bookingData) {
    return createResponse('error', 'Booking not found')
  }
  
  const booking = bookingData as any
  
  if (booking.booking_status !== 'confirmed') {
    return createResponse('info', 'This booking has already been processed.')
  }
  
  const reservation = booking.reservation
  const session = reservation.session
  const experienceDate = session?.session_date || reservation.requested_date
  
  // Check if within cancellation window (7+ days before)
  if (experienceDate) {
    const daysUntil = differenceInDays(parseISO(experienceDate), new Date())
    if (daysUntil < 7) {
      return createResponse('error', `Cancellation is no longer available. You can only cancel up to 7 days before the experience. (${daysUntil} days remaining)`)
    }
  }
  
  try {
    // Process refund
    if (booking.stripe_charge_id) {
      await createRefund(booking.stripe_charge_id)
    }
    
    // Update booking status
    const updateClient = createAdminClient()
    await (updateClient
      .from('bookings') as any)
      .update({
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    
    // Release spots if session-based
    if (reservation.session_id) {
      const { data: currentSession } = await updateClient
        .from('experience_sessions')
        .select('spots_available')
        .eq('id', reservation.session_id)
        .single()
      
      if (currentSession) {
        await (updateClient
          .from('experience_sessions') as any)
          .update({
            spots_available: (currentSession as any).spots_available + reservation.participants,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reservation.session_id)
      }
    }
    
    // Send confirmation email
    await sendEmail({
      to: reservation.guest_email,
      subject: `Cancellation confirmed - ${reservation.experience.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111;">Cancellation Confirmed</h1>
          <p>Hi ${reservation.guest_name},</p>
          <p>Your booking for <strong>${reservation.experience.title}</strong> has been cancelled.</p>
          <p>A full refund has been initiated and will appear on your statement within 5-10 business days.</p>
          <p style="color: #666; margin-top: 20px;">We hope to see you again soon!</p>
        </div>
      `,
    })
    
    return createResponse('success', 'Your booking has been cancelled and a refund has been initiated.')
  } catch (error) {
    console.error('Cancel booking error:', error)
    return createResponse('error', 'Failed to process cancellation. Please try again.')
  }
}

function createResponse(type: 'success' | 'error' | 'info', message: string) {
  const colors = {
    success: { bg: '#dcfce7', icon: '#16a34a' },
    error: { bg: '#fee2e2', icon: '#dc2626' },
    info: { bg: '#fef3c7', icon: '#d97706' },
  }
  
  const titles = {
    success: 'Cancellation Confirmed',
    error: 'Error',
    info: 'Information',
  }
  
  const icons = {
    success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />',
    error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />',
    info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />',
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${titles[type]}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .card { background: white; padding: 48px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .icon { width: 64px; height: 64px; background: ${colors[type].bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: ${colors[type].icon}; }
        h1 { margin: 0 0 12px; font-size: 24px; color: #111; }
        p { margin: 0; color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: ${colors[type].icon}">
            ${icons[type]}
          </svg>
        </div>
        <h1>${titles[type]}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
  
  return new NextResponse(html, {
    status: type === 'error' ? 400 : 200,
    headers: { 'Content-Type': 'text/html' },
  })
}
