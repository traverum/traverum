import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/index'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) return true // Allow if no secret configured
  return authHeader === `Bearer ${cronSecret}`
}

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createAdminClient()
  
  // Find pending reservations past their response deadline
  const { data: expiredReservations, error } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, currency)
    `)
    .eq('reservation_status', 'pending')
    .lt('response_deadline', new Date().toISOString())
  
  if (error) {
    console.error('Error fetching expired reservations:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  
  let processed = 0
  const reservationsList = (expiredReservations || []) as any[]
  
  for (const reservation of reservationsList) {
    try {
      // Update status to expired
      await (supabase
        .from('reservations') as any)
        .update({
          reservation_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)
      
      // Send email to guest
      const experience = reservation.experience as any
      
      await sendEmail({
        to: reservation.guest_email,
        subject: `Booking request expired - ${experience.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #111;">Request Expired</h1>
            <p>Hi ${reservation.guest_name},</p>
            <p>Unfortunately, the experience provider did not respond to your booking request within 48 hours.</p>
            <p><strong>Experience:</strong> ${experience.title}</p>
            <p>We apologize for any inconvenience. Feel free to submit a new request or try a different time.</p>
          </div>
        `,
      })
      
      processed++
    } catch (err) {
      console.error(`Error processing reservation ${reservation.id}:`, err)
    }
  }
  
  return NextResponse.json({
    success: true,
    processed,
    message: `Expired ${processed} pending reservations`,
  })
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
