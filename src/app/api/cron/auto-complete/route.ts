import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createTransfer } from '@/lib/stripe'
import { sendEmail } from '@/lib/email/index'
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
  
  // Find confirmed bookings where experience was 7+ days ago
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
      
      // Send notification to supplier
      if (supplier?.email) {
        await sendEmail({
          to: supplier.email,
          subject: `Auto-completed: Payment transferred - ${experience.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #111;">Payment Transferred</h1>
              <p>Hi ${supplier.name},</p>
              <p>A booking has been automatically marked as completed (7 days after the experience date with no response).</p>
              <p><strong>Experience:</strong> ${experience.title}</p>
              <p><strong>Guest:</strong> ${reservation.guest_name}</p>
              <p><strong>Amount transferred:</strong> €${(booking.supplier_amount_cents / 100).toFixed(2)}</p>
              <p style="color: #666; margin-top: 20px;">If the experience did not happen, please contact support.</p>
            </div>
          `,
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
