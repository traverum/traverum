import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { supplierCompletionCheck } from '@/lib/email/templates'
import { generateCompleteToken, generateNoExperienceToken } from '@/lib/tokens'
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
  const appUrl = getAppUrl()
  
  // Find confirmed bookings where the experience was yesterday
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(
          title,
          currency,
          supplier:partners!experiences_partner_fk(email, name)
        ),
        session:experience_sessions(session_date, start_time)
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
      
      // Check if experience was yesterday
      if (experienceDate !== yesterday) {
        continue
      }
      
      const experience = reservation.experience as any
      const supplier = experience.supplier
      
      if (!supplier?.email) {
        continue
      }
      
      // Generate tokens
      const completeToken = generateCompleteToken(booking.id)
      const noExperienceToken = generateNoExperienceToken(booking.id)
      
      const completeUrl = `${appUrl}/api/bookings/${booking.id}/complete?token=${completeToken}`
      const noExperienceUrl = `${appUrl}/api/bookings/${booking.id}/no-experience?token=${noExperienceToken}`
      
      // Send completion check email
      const emailHtml = supplierCompletionCheck({
        experienceTitle: experience.title,
        guestName: reservation.guest_name,
        date: experienceDate,
        time: session?.start_time || reservation.requested_time || '',
        participants: reservation.participants,
        totalCents: booking.amount_cents,
        currency: experience.currency,
        bookingId: booking.id,
        completeUrl,
        noExperienceUrl,
      })
      
      await sendEmail({
        to: supplier.email,
        subject: `Did the experience happen? - ${experience.title}`,
        html: emailHtml,
      })
      
      processed++
    } catch (err) {
      console.error(`Error processing booking ${booking.id}:`, err)
    }
  }
  
  return NextResponse.json({
    success: true,
    processed,
    message: `Sent ${processed} completion check emails`,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
