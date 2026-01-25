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

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  const appUrl = getAppUrl()
  
  // Verify token
  if (!token) {
    return createErrorResponse('Missing token', appUrl)
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    return createErrorResponse('Invalid or expired token', appUrl)
  }
  
  if (payload.id !== id || payload.action !== 'accept') {
    return createErrorResponse('Invalid token', appUrl)
  }
  
  const supabase = createAdminClient()
  
  // Get reservation with related data
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
    .eq('id', id)
    .single()
  
  if (!reservationData) {
    return createErrorResponse('Reservation not found', appUrl)
  }
  
  const reservation = reservationData as any
  
  // Check if already processed
  if (reservation.reservation_status !== 'pending') {
    return createAlreadyProcessedResponse(reservation.reservation_status, appUrl)
  }
  
  const experience = reservation.experience
  const supplier = experience.supplier
  
  // Check if supplier has Stripe onboarding complete
  if (!supplier.stripe_onboarding_complete) {
    return createErrorResponse(
      'You need to complete Stripe onboarding before accepting bookings. Please contact support.',
      appUrl
    )
  }
  
  // Get hotel config for redirect URL
  const { data: hotelConfig } = await supabase
    .from('hotel_configs')
    .select('slug')
    .eq('partner_id', reservation.hotel_id)
    .single()
  
  const hotelSlug = (hotelConfig as any)?.slug || 'default'
  
  try {
    // Create Stripe Payment Link
    const paymentLink = await createPaymentLink({
      reservationId: reservation.id,
      experienceTitle: experience.title,
      amountCents: reservation.total_cents,
      currency: experience.currency,
      successUrl: `${appUrl}/${hotelSlug}/confirmation/{CHECKOUT_SESSION_ID}`,
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
    
    // Get date and time
    const date = reservation.session?.session_date || reservation.requested_date || ''
    const time = reservation.session?.start_time || reservation.requested_time || ''
    
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
    })
    
    await sendEmail({
      to: reservation.guest_email,
      subject: `Your booking is approved! Complete payment - ${experience.title}`,
      html: emailHtml,
    })
    
    // Return success page
    return new NextResponse(
      generateSuccessHtml('Booking Accepted', 'The guest has been notified and sent a payment link.'),
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    )
  } catch (error) {
    console.error('Accept reservation error:', error)
    return createErrorResponse('Failed to process acceptance. Please try again.', appUrl)
  }
}

function createErrorResponse(message: string, appUrl: string) {
  return new NextResponse(
    generateErrorHtml('Error', message),
    {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    }
  )
}

function createAlreadyProcessedResponse(status: string, appUrl: string) {
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
        .icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .icon svg { width: 32px; height: 32px; color: #16a34a; }
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
