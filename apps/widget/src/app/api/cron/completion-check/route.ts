import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { supplierCompletionCheck } from '@/lib/email/templates'
import { generateCompleteToken, generateNoExperienceToken } from '@/lib/tokens'
import { isCompletionCheckDue, resolveBookingExperienceDate } from '@/lib/cron-rules'

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
  const nowISO = new Date().toISOString()
  
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      reservation:reservations(
        *,
        experience:experiences(
          title,
          currency,
          duration_minutes,
          supplier:partners!experiences_partner_fk(email, name)
        ),
        session:experience_sessions(session_date, start_time, end_time)
      )
    `)
    .eq('booking_status', 'confirmed')
    .is('completion_check_sent_at', null)
  
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
      const experience = reservation.experience as any
      const experienceDate = resolveBookingExperienceDate(session?.session_date, reservation?.requested_date)

      const endTime = session?.end_time ?? null
      const startTime = session?.start_time ?? reservation?.requested_time ?? null
      const durationMinutes = experience?.duration_minutes ?? null

      if (!isCompletionCheckDue(experienceDate, nowISO, endTime, startTime, durationMinutes)) {
        continue
      }
      
      const supplier = experience.supplier
      
      if (!supplier?.email) {
        continue
      }
      
      const completeToken = generateCompleteToken(booking.id)
      const noExperienceToken = generateNoExperienceToken(booking.id)
      
      const completeUrl = `${appUrl}/api/bookings/${booking.id}/complete?token=${completeToken}`
      const noExperienceUrl = `${appUrl}/api/bookings/${booking.id}/no-experience?token=${noExperienceToken}`
      
      const emailHtml = supplierCompletionCheck({
        experienceTitle: experience.title,
        guestName: reservation.guest_name,
        date: experienceDate || '',
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

      await (supabase.from('bookings') as any)
        .update({ completion_check_sent_at: nowISO })
        .eq('id', booking.id)
      
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
