import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/index'
import { baseTemplate } from '@/lib/email/templates'
import { escapeHtml } from '@/lib/sanitize'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminClient()
  
  // Find approved reservations past their payment deadline with no booking
  const { data: unpaidReservations, error } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(
        title, 
        currency,
        supplier:partners!experiences_partner_fk(email, name)
      )
    `)
    .eq('reservation_status', 'approved')
    .lt('payment_deadline', new Date().toISOString())
  
  if (error) {
    console.error('Error fetching unpaid reservations:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  
  let processed = 0
  const reservationsList = (unpaidReservations || []) as any[]
  
  for (const reservation of reservationsList) {
    try {
      // Check if booking exists (payment completed after deadline but before this cron)
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('reservation_id', reservation.id)
        .single()
      
      if (existingBooking) {
        // Booking exists, skip
        continue
      }
      
      // Update status to expired
      await (supabase
        .from('reservations') as any)
        .update({
          reservation_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)
      
      // Session was never claimed (stays 'available'), so no release needed.
      
      const experience = reservation.experience as any
      
      await sendEmail({
        to: reservation.guest_email,
        subject: `Payment window closed - ${experience.title}`,
        html: baseTemplate(`
          <div class="card">
            <div class="header"><h1>Payment Window Closed</h1></div>
            <p>Hi ${escapeHtml(reservation.guest_name)},</p>
            <p>The payment window for your booking has closed. The provider approved your request, but payment was not completed within 24 hours.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Experience</span>
                <span class="info-value">${experience.title}</span>
              </div>
            </div>
            <p>Feel free to submit a new booking request if you're still interested.</p>
          </div>
        `, 'Payment Window Closed'),
      })
      
      if (experience.supplier?.email) {
        await sendEmail({
          to: experience.supplier.email,
          subject: `Guest did not complete payment - ${experience.title}`,
          html: baseTemplate(`
            <div class="card">
              <div class="header"><h1>Payment Not Completed</h1></div>
              <p>Hi ${experience.supplier.name},</p>
              <p>The guest did not complete payment within the 24-hour window.</p>
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Guest</span>
                  <span class="info-value">${escapeHtml(reservation.guest_name)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Experience</span>
                  <span class="info-value">${experience.title}</span>
                </div>
              </div>
              <p class="text-muted">The time slot has been released and is available for other bookings.</p>
            </div>
          `, 'Payment Not Completed'),
        })
      }
      
      processed++
    } catch (err) {
      console.error(`Error processing reservation ${reservation.id}:`, err)
    }
  }
  
  return NextResponse.json({
    success: true,
    processed,
    message: `Expired ${processed} unpaid reservations`,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
