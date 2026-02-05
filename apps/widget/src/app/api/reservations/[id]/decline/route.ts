import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestRequestDeclined } from '@/lib/email/templates'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  const appUrl = getAppUrl()
  
  // Verify token
  if (!token) {
    return createErrorResponse('Missing token')
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    return createErrorResponse('Invalid or expired token')
  }
  
  if (payload.id !== id || payload.action !== 'decline') {
    return createErrorResponse('Invalid token')
  }
  
  const supabase = createAdminClient()
  
  // Get reservation with experience
  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, currency),
      session:experience_sessions(session_date, start_time)
    `)
    .eq('id', id)
    .single()
  
  if (!reservationData) {
    return createErrorResponse('Reservation not found')
  }
  
  const reservation = reservationData as any
  
  // Check if already processed
  if (reservation.reservation_status !== 'pending') {
    return createAlreadyProcessedResponse(reservation.reservation_status)
  }
  
  try {
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
    const time = reservation.session?.start_time || reservation.requested_time || ''
    
    // Send email to guest
    const emailHtml = guestRequestDeclined({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date,
      time,
      participants: reservation.participants,
      totalCents: reservation.total_cents,
      currency: experience.currency,
    })
    
    await sendEmail({
      to: reservation.guest_email,
      subject: `Booking update - ${experience.title}`,
      html: emailHtml,
    })
    
    // Return success page
    return new NextResponse(
      generateSuccessHtml('Booking Declined', 'The guest has been notified that this time is not available.'),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (error) {
    console.error('Decline reservation error:', error)
    return createErrorResponse('Failed to process. Please try again.')
  }
}

function createErrorResponse(message: string) {
  return new NextResponse(
    generateErrorHtml('Error', message),
    {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}

function createAlreadyProcessedResponse(status: string) {
  const messages: Record<string, string> = {
    approved: 'This booking has already been accepted.',
    declined: 'This booking has already been declined.',
    expired: 'This booking request has expired.',
  }
  
  return new NextResponse(
    generateInfoHtml('Already Processed', messages[status] || 'This booking has already been processed.'),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }
  )
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

function generateInfoHtml(title: string, message: string) {
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
        .icon { width: 64px; height: 64px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #d97706; }
        h1 { margin: 0 0 12px; font-size: 24px; color: #111; }
        p { margin: 0; color: #666; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}
