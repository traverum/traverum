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
  const now = new Date().toISOString()
  
  // Track processing results
  let pendingProcessed = 0
  let unpaidProcessed = 0
  
  // ============================================
  // PART 1: Expire pending reservations (past response deadline)
  // ============================================
  const { data: expiredPendingReservations, error: pendingError } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, currency)
    `)
    .eq('reservation_status', 'pending')
    .lt('response_deadline', now)
  
  if (pendingError) {
    console.error('Error fetching expired pending reservations:', pendingError)
  } else {
    const pendingList = (expiredPendingReservations || []) as any[]
    
    for (const reservation of pendingList) {
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
        
        pendingProcessed++
      } catch (err) {
        console.error(`Error processing pending reservation ${reservation.id}:`, err)
      }
    }
  }
  
  // ============================================
  // PART 2: Expire unpaid reservations (past payment deadline)
  // ============================================
  const { data: unpaidReservations, error: unpaidError } = await supabase
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
    .lt('payment_deadline', now)
  
  if (unpaidError) {
    console.error('Error fetching unpaid reservations:', unpaidError)
  } else {
    const unpaidList = (unpaidReservations || []) as any[]
    
    for (const reservation of unpaidList) {
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
        
        // Release spots if session-based
        if (reservation.session_id) {
          const { data: session } = await supabase
            .from('experience_sessions')
            .select('spots_available')
            .eq('id', reservation.session_id)
            .single()
          
          if (session) {
            await (supabase
              .from('experience_sessions') as any)
              .update({
                spots_available: (session as any).spots_available + reservation.participants,
                updated_at: new Date().toISOString(),
              })
              .eq('id', reservation.session_id)
          }
        }
        
        const experience = reservation.experience as any
        
        // Send email to guest
        await sendEmail({
          to: reservation.guest_email,
          subject: `Payment window closed - ${experience.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #111;">Payment Window Closed</h1>
              <p>Hi ${reservation.guest_name},</p>
              <p>The payment window for your booking has closed. The provider approved your request, but payment was not completed within 24 hours.</p>
              <p><strong>Experience:</strong> ${experience.title}</p>
              <p>Feel free to submit a new booking request if you're still interested.</p>
            </div>
          `,
        })
        
        // Send email to supplier
        if (experience.supplier?.email) {
          await sendEmail({
            to: experience.supplier.email,
            subject: `Guest did not complete payment - ${experience.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #111;">Payment Not Completed</h1>
                <p>Hi ${experience.supplier.name},</p>
                <p>The guest did not complete payment within the 24-hour window.</p>
                <p><strong>Guest:</strong> ${reservation.guest_name}</p>
                <p><strong>Experience:</strong> ${experience.title}</p>
                <p>The time slot has been released and is available for other bookings.</p>
              </div>
            `,
          })
        }
        
        unpaidProcessed++
      } catch (err) {
        console.error(`Error processing unpaid reservation ${reservation.id}:`, err)
      }
    }
  }
  
  return NextResponse.json({
    success: true,
    pending: {
      processed: pendingProcessed,
      message: `Expired ${pendingProcessed} pending reservations`,
    },
    unpaid: {
      processed: unpaidProcessed,
      message: `Expired ${unpaidProcessed} unpaid reservations`,
    },
    total: pendingProcessed + unpaidProcessed,
  })
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
