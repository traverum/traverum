import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { createRefund } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
import { guestRefundProcessed, supplierGuestCancelled } from '@/lib/email/templates'
import { differenceInDays, parseISO, format } from 'date-fns'
import { canGuestCancel } from '@/lib/availability'

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
  
  // Get booking with related data (supplier for notification, session start_time for emails)
  const { data: bookingData } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(
          title,
          currency,
          cancellation_policy,
          supplier:partners!experiences_partner_fk(email, name)
        ),
        session:experience_sessions(session_date, start_time)
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
  const experience = reservation.experience
  // Rentals use rental_start_date; session-based use session_date or requested_date
  const experienceDate =
    session?.session_date ||
    reservation.requested_date ||
    reservation.rental_start_date ||
    ''

  // Compare calendar dates consistently so "days until" is stable across day boundaries
  const todayServer = format(new Date(), 'yyyy-MM-dd')
  const daysUntil =
    experienceDate && experienceDate.length >= 10
      ? differenceInDays(parseISO(experienceDate), parseISO(todayServer))
      : 999
  const { canCancel, message } = canGuestCancel(experience?.cancellation_policy ?? 'moderate', daysUntil)
  if (!canCancel) {
    return createResponse('error', message)
  }
  
  try {
    // Process refund (skip if already refunded, e.g. duplicate cancel or retry)
    if (booking.stripe_charge_id) {
      try {
        await createRefund(booking.stripe_charge_id)
      } catch (refundErr: unknown) {
        const code = (refundErr as { code?: string })?.code
        if (code !== 'charge_already_refunded') throw refundErr
        // Already refunded: continue to update booking and send emails
      }
    }

    // Update booking status and clear session reference so we can delete the session
    const updateClient = createAdminClient()
    await (updateClient
      .from('bookings') as any)
      .update({
        booking_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        session_id: null,
      })
      .eq('id', id)

    // Delete the session so the slot disappears from the calendar (no surprise rebookings)
    if (reservation.session_id) {
      await (updateClient.from('experience_sessions') as any)
        .delete()
        .eq('id', reservation.session_id)
    }
    
    const dateStr = experienceDate || ''
    const timeStr = session?.start_time ?? reservation.requested_time ?? null

    // Guest: cancellation + refund confirmation (on-brand template)
    const guestEmailHtml = guestRefundProcessed({
      experienceTitle: experience.title,
      guestName: reservation.guest_name,
      date: dateStr,
      time: timeStr,
      participants: reservation.participants ?? 1,
      totalCents: reservation.total_cents ?? 0,
      currency: experience.currency ?? undefined,
      bookingId: booking.id,
      refundAmount: booking.amount_cents ?? reservation.total_cents ?? 0,
    })
    await sendEmail({
      to: reservation.guest_email,
      subject: `Cancellation confirmed - ${experience.title}`,
      html: guestEmailHtml,
    })

    // Supplier: notify that guest cancelled and slot is released
    const supplier = experience.supplier
    if (supplier?.email) {
      const supplierEmailHtml = supplierGuestCancelled({
        experienceTitle: experience.title,
        bookingId: booking.id,
        date: dateStr,
        time: timeStr,
      })
      await sendEmail({
        to: supplier.email,
        subject: `Booking cancelled by guest - ${experience.title}`,
        html: supplierEmailHtml,
      })
    }

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titles[type]}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;500&display=swap');
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: rgb(55, 53, 47); margin: 0; padding: 0; background-color: #F4EFE6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 16px; width: 100%; }
    .card { background: #FEFCF9; border-radius: 6px; padding: 36px 32px; border: 1px solid rgba(55, 53, 47, 0.09); text-align: center; }
    .icon { width: 64px; height: 64px; background: ${colors[type].bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .icon svg { width: 32px; height: 32px; color: ${colors[type].icon}; }
    .header { margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 300; color: #5D4631; letter-spacing: -0.01em; }
    p { margin: 0; color: rgba(55, 53, 47, 0.8); font-size: 15px; font-weight: 300; line-height: 1.6; }
    .footer { text-align: center; color: rgba(55, 53, 47, 0.3); font-size: 12px; margin-top: 24px; letter-spacing: 0.02em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="icon">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: ${colors[type].icon}">${icons[type]}</svg>
      </div>
      <div class="header"><h1>${titles[type]}</h1></div>
      <p>${message}</p>
    </div>
    <div class="footer">Powered by Traverum</div>
  </div>
</body>
</html>
  `
  return new NextResponse(html, {
    status: type === 'error' ? 400 : 200,
    headers: { 'Content-Type': 'text/html' },
  })
}
