import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import {
  guestAttendanceReminder,
  baseTemplate,
  guestNoShowCharged,
  guestCancellationChargeFailed,
} from '@/lib/email/templates'
import { escapeHtml } from '@/lib/sanitize'
import { ATTENDANCE_REMINDER_DAY, PAYMENT_MODES } from '@traverum/shared'
import { differenceInCalendarDays } from 'date-fns'
import { processCancellationCharge } from '@/lib/cancellation-charges'

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
  const now = new Date()

  const { data: verifications, error } = await supabase
    .from('attendance_verifications')
    .select(`
      *,
      booking:bookings(
        id,
        amount_cents,
        payment_mode,
        supplier_amount_cents,
        hotel_amount_cents,
        platform_amount_cents,
        reservation:reservations(
          guest_name,
          guest_email,
          requested_date,
          session_id,
          stripe_setup_intent_id,
          stripe_customer_id,
          session:experience_sessions(session_date),
          experience:experiences(
            title,
            currency,
            supplier:partners!experiences_partner_fk(email, name)
          )
        )
      )
    `)
    .eq('outcome', 'pending')
    .is('guest_response', null)

  if (error) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let reminders = 0
  let autoResolved = 0
  const verificationsList = (verifications || []) as any[]

  for (const v of verificationsList) {
    try {
      const booking = v.booking
      const reservation = booking?.reservation
      const experience = reservation?.experience
      const supplier = experience?.supplier
      const deadline = new Date(v.deadline)
      const createdAt = new Date(v.created_at)
      const daysSinceCreated = differenceInCalendarDays(now, createdAt)

      if (now >= deadline) {
        await (supabase.from('attendance_verifications') as any)
          .update({
            outcome: 'supplier_upheld',
          })
          .eq('id', v.id)

        await (supabase.from('bookings') as any)
          .update({
            booking_status: 'cancelled',
            cancelled_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', booking.id)

        if (reservation?.session_id) {
          await (supabase.from('experience_sessions') as any)
            .update({
              session_status: 'available',
              updated_at: now.toISOString(),
            })
            .eq('id', reservation.session_id)
        }

        // Charge guest's saved card for no-show (pay_on_site only)
        let chargeSucceeded = false
        const isPayOnSite = booking.payment_mode === PAYMENT_MODES.PAY_ON_SITE
        const setupIntentId = reservation?.stripe_setup_intent_id
        const customerId = reservation?.stripe_customer_id
        const experienceDate = reservation?.session?.session_date || reservation?.requested_date || ''

        if (isPayOnSite && setupIntentId && customerId) {
          const chargeResult = await processCancellationCharge({
            supabase,
            bookingId: booking.id,
            stripeSetupIntentId: setupIntentId,
            stripeCustomerId: customerId,
            amountCents: booking.amount_cents,
            currency: experience?.currency || 'EUR',
            reason: 'no_show',
            commissionSplitCents: {
              supplier: booking.supplier_amount_cents,
              hotel: booking.hotel_amount_cents,
              platform: booking.platform_amount_cents,
            },
          })
          chargeSucceeded = chargeResult.success
        }

        if (reservation?.guest_email) {
          if (isPayOnSite && chargeSucceeded) {
            await sendEmail({
              to: reservation.guest_email,
              subject: `No-show fee charged - ${experience?.title}`,
              html: guestNoShowCharged({
                experienceTitle: experience?.title || 'Unknown Experience',
                guestName: reservation.guest_name,
                date: experienceDate,
                bookingId: booking.id,
                chargeAmountCents: booking.amount_cents,
                currency: experience?.currency,
              }),
            })
          } else if (isPayOnSite && setupIntentId && customerId && !chargeSucceeded) {
            await sendEmail({
              to: reservation.guest_email,
              subject: `Booking cancelled - ${experience?.title}`,
              html: guestCancellationChargeFailed({
                experienceTitle: experience?.title || 'Unknown Experience',
                guestName: reservation.guest_name,
                date: experienceDate,
                bookingId: booking.id,
                chargeAmountCents: booking.amount_cents,
                currency: experience?.currency,
                reason: 'no_show',
              }),
            })
          } else {
            await sendEmail({
              to: reservation.guest_email,
              subject: `Booking cancelled - ${experience?.title}`,
              html: baseTemplate(`
                <div class="card">
                  <div class="header"><h1>Booking Cancelled</h1></div>
                  <p>Hi ${escapeHtml(reservation.guest_name)},</p>
                  <p>The attendance verification period has ended without a response. Based on the provider's report, your booking has been cancelled.</p>
                  <div class="info-box">
                    <div class="info-row">
                      <span class="info-label">Experience</span>
                      <span class="info-value">${experience?.title}</span>
                    </div>
                  </div>
                  <p class="text-muted">No charge was made to your card. If you believe this is incorrect, please contact support.</p>
                </div>
              `, 'Booking Cancelled'),
            })
          }
        }

        if (supplier?.email) {
          await sendEmail({
            to: supplier.email,
            subject: `No-show confirmed - ${experience?.title}`,
            html: baseTemplate(`
              <div class="card">
                <div class="header"><h1>No-Show Confirmed</h1></div>
                <p>Hi ${escapeHtml(supplier.name)},</p>
                <p>The guest did not respond to the attendance verification within the deadline. Your report has been upheld and the booking has been cancelled. No commission applies.</p>
                <div class="info-box">
                  <div class="info-row">
                    <span class="info-label">Experience</span>
                    <span class="info-value">${experience?.title}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Guest</span>
                    <span class="info-value">${escapeHtml(reservation.guest_name)}</span>
                  </div>
                </div>
              </div>
            `, 'No-Show Confirmed'),
          })
        }

        autoResolved++
        console.log(
          `Auto-resolved attendance verification ${v.id} as supplier_upheld (deadline passed)` +
            (isPayOnSite ? `, no-show charge ${chargeSucceeded ? 'succeeded' : 'failed/skipped'}` : '')
        )
        continue
      }

      if (daysSinceCreated >= ATTENDANCE_REMINDER_DAY && !v.reminder_sent) {
        const verificationUrl = `${appUrl}/api/attendance/${v.verification_token}`
        const experienceDate = reservation?.session?.session_date || reservation?.requested_date || ''

        await sendEmail({
          to: reservation.guest_email,
          subject: `Reminder: Did you attend ${experience?.title}?`,
          html: guestAttendanceReminder({
            experienceTitle: experience?.title || 'Unknown Experience',
            guestName: reservation.guest_name,
            date: experienceDate,
            verificationUrl,
            deadlineDate: v.deadline.split('T')[0],
          }),
        })

        await (supabase.from('attendance_verifications') as any)
          .update({ reminder_sent: true })
          .eq('id', v.id)

        reminders++
        console.log(`Sent attendance reminder for verification ${v.id}`)
      }
    } catch (err) {
      console.error(`Error processing verification ${v.id}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    reminders,
    auto_resolved: autoResolved,
    message: `Sent ${reminders} reminders, auto-resolved ${autoResolved} verifications`,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
