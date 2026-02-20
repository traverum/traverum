import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createTransfer } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
import { baseTemplate } from '@/lib/email/templates'
import { escapeHtml } from '@/lib/sanitize'
import { format, subDays } from 'date-fns'

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
  
  // Uses server (UTC) calendar date; auto-complete/transfer can be up to one
  // day early or late for experiences in other timezones. To fix, store an IANA
  // timezone per partner/experience and compute the cutoff in that TZ.
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(
          title,
          currency,
          supplier:partners!experiences_partner_fk(email, name, stripe_account_id)
        ),
        session:experience_sessions(session_date)
      )
    `)
    .eq('booking_status', 'confirmed')
  
  if (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
  
  let processed = 0
  const bookingsList = (bookings || []) as any[]
  
  for (const booking of bookingsList) {
    try {
      const reservation = booking.reservation
      const session = reservation?.session
      const experienceDate = session?.session_date || reservation?.requested_date
      
      // Check if experience was 7+ days ago
      if (!experienceDate || experienceDate > sevenDaysAgo) {
        continue
      }
      
      const experience = reservation.experience
      const supplier = experience.supplier
      
      // Auto-complete: Transfer funds to supplier
      let transferId = null
      if (supplier?.stripe_account_id && booking.supplier_amount_cents > 0) {
        try {
          const transfer = await createTransfer(
            booking.supplier_amount_cents,
            experience.currency,
            supplier.stripe_account_id,
            booking.id
          )
          transferId = transfer.id
        } catch (transferErr) {
          console.error(`Transfer failed for booking ${booking.id}:`, transferErr)
          // Continue to mark as completed even if transfer fails
        }
      }
      
      // Update booking status
      await (supabase
        .from('bookings') as any)
        .update({
          booking_status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_transfer_id: transferId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
      
      if (supplier?.email) {
        await sendEmail({
          to: supplier.email,
          subject: `Payment transferred - ${experience.title}`,
          html: baseTemplate(`
            <div class="card">
              <div class="header"><h1>Payment Transferred</h1></div>
              <p>Hi ${supplier.name},</p>
              <p>A booking has been automatically completed and your payment has been transferred.</p>
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Experience</span>
                  <span class="info-value">${experience.title}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Guest</span>
                  <span class="info-value">${escapeHtml(reservation.guest_name)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Amount Transferred</span>
                  <span class="info-value">${new Intl.NumberFormat('fi-FI', { style: 'currency', currency: experience.currency || 'EUR' }).format(booking.supplier_amount_cents / 100)}</span>
                </div>
              </div>
              <p class="text-muted">If the experience did not happen, please contact support.</p>
            </div>
          `, 'Payment Transferred'),
        })
      }
      
      processed++
    } catch (err) {
      console.error(`Error processing booking ${booking.id}:`, err)
    }
  }
  
  return NextResponse.json({
    success: true,
    processed,
    message: `Auto-completed ${processed} bookings`,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
