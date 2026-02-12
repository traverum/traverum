import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/index'
import { guestMinimumNotReached, supplierMinimumNotReached } from '@/lib/email/templates'
import { addHours } from 'date-fns'

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
  let minimumCancelledProcessed = 0
  
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
  
  // ============================================
  // PART 3: Cancel pending_minimum reservations where session is < 48h away and min not met
  // ============================================
  const cutoff48h = addHours(new Date(), 48).toISOString().split('T')[0] // date string for comparison

  // Find sessions with pending_minimum reservations that are within 48 hours
  const { data: pendingMinReservations, error: pendingMinError } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(title, currency, min_participants, slug, supplier:partners!experiences_partner_fk(email, name)),
      session:experience_sessions(id, session_date, start_time, spots_total, spots_available)
    `)
    .eq('reservation_status', 'pending_minimum')

  if (pendingMinError) {
    console.error('Error fetching pending_minimum reservations:', pendingMinError)
  } else {
    const minResList = (pendingMinReservations || []) as any[]

    // Group by session to determine if threshold is met
    const sessionGroups = new Map<string, any[]>()
    for (const res of minResList) {
      if (!res.session?.id) continue
      const existing = sessionGroups.get(res.session.id) || []
      existing.push(res)
      sessionGroups.set(res.session.id, existing)
    }

    for (const [sessionId, reservations] of Array.from(sessionGroups.entries())) {
      const session = reservations[0].session
      const experience = reservations[0].experience

      // Check if session is within 48 hours
      if (session.session_date > cutoff48h) continue

      // Check if minimum is still not met
      const minP = experience?.min_participants || 1
      const booked = session.spots_total - session.spots_available
      if (booked >= minP) continue // minimum met, don't cancel

      // Cancel all pending_minimum reservations for this session
      for (const reservation of reservations) {
        try {
          // Update status to cancelled_minimum
          await (supabase
            .from('reservations') as any)
            .update({
              reservation_status: 'cancelled_minimum',
              updated_at: new Date().toISOString(),
            })
            .eq('id', reservation.id)

          // Release spots
          if (reservation.session?.id) {
            const { data: currentSession } = await supabase
              .from('experience_sessions')
              .select('spots_available')
              .eq('id', reservation.session.id)
              .single()

            if (currentSession) {
              await (supabase
                .from('experience_sessions') as any)
                .update({
                  spots_available: (currentSession as any).spots_available + reservation.participants,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', reservation.session.id)
            }
          }

          // Email guest
          const guestEmailHtml = guestMinimumNotReached({
            experienceTitle: experience.title,
            guestName: reservation.guest_name,
            date: session.session_date,
            time: session.start_time,
            participants: reservation.participants,
            totalCents: reservation.total_cents,
            currency: experience.currency,
            minParticipants: minP,
            bookedSoFar: booked,
          })

          await sendEmail({
            to: reservation.guest_email,
            subject: `Reservation cancelled — minimum not reached for ${experience.title}`,
            html: guestEmailHtml,
          })

          minimumCancelledProcessed++
        } catch (err) {
          console.error(`Error cancelling pending_minimum reservation ${reservation.id}:`, err)
        }
      }

      // Email supplier once per session
      if (experience.supplier?.email) {
        try {
          const supplierEmailHtml = supplierMinimumNotReached({
            experienceTitle: experience.title,
            date: session.session_date,
            time: session.start_time,
            minParticipants: minP,
            bookedSoFar: booked,
            dashboardUrl: 'https://dashboard.traverum.com/supplier/sessions',
          })

          await sendEmail({
            to: experience.supplier.email,
            subject: `Session cancelled — minimum not reached for ${experience.title}`,
            html: supplierEmailHtml,
          })
        } catch (err) {
          console.error(`Error sending supplier minimum not reached email for session ${sessionId}:`, err)
        }
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
    minimumCancelled: {
      processed: minimumCancelledProcessed,
      message: `Cancelled ${minimumCancelledProcessed} pending_minimum reservations (session <48h, min not met)`,
    },
    total: pendingProcessed + unpaidProcessed + minimumCancelledProcessed,
  })
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
