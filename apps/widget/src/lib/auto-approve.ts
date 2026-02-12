import { createAdminClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/stripe'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { guestBookingApproved } from '@/lib/email/templates'
import { addHours } from 'date-fns'

/**
 * Auto-approve all pending_minimum reservations for a session.
 * Called when:
 *   (a) a new booking tips the total past min_participants
 *   (b) the supplier clicks "Confirm Session"
 *
 * For each pending_minimum reservation:
 *   1. Create a Stripe payment link
 *   2. Update status to 'approved' with a 24h payment deadline
 *   3. Email the guest with the payment link
 */
export async function autoApprovePendingMinimum(sessionId: string): Promise<{
  approved: number
  errors: string[]
}> {
  const supabase = createAdminClient()
  const appUrl = getAppUrl()
  const errors: string[] = []
  let approved = 0

  // Fetch all pending_minimum reservations for this session
  const { data: reservations, error: fetchError } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(*, supplier:partners!experiences_partner_fk(*))
    `)
    .eq('session_id', sessionId)
    .eq('reservation_status', 'pending_minimum')

  if (fetchError || !reservations || reservations.length === 0) {
    return { approved: 0, errors: fetchError ? [fetchError.message] : [] }
  }

  // Get session data for date/time
  const { data: sessionData } = await supabase
    .from('experience_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!sessionData) {
    return { approved: 0, errors: ['Session not found'] }
  }

  const session = sessionData as any

  // Get hotel config for URL building
  const firstRes = reservations[0] as any
  const { data: hotelConfig } = await supabase
    .from('hotel_configs')
    .select('slug')
    .eq('partner_id', firstRes.hotel_id)
    .single()
  
  const hotelSlug = (hotelConfig as any)?.slug || 'default'

  for (const res of reservations) {
    const reservation = res as any
    const experience = reservation.experience

    if (!experience?.supplier?.stripe_onboarding_complete) {
      errors.push(`Reservation ${reservation.id}: supplier Stripe onboarding incomplete`)
      continue
    }

    try {
      // Create Stripe payment link
      const paymentLink = await createPaymentLink({
        reservationId: reservation.id,
        experienceTitle: experience.title,
        amountCents: reservation.total_cents,
        currency: experience.currency,
        successUrl: `${appUrl}/${hotelSlug}/confirmation/${reservation.id}`,
        cancelUrl: `${appUrl}/${hotelSlug}/reservation/${reservation.id}`,
      })

      // Update reservation to approved
      const paymentDeadline = addHours(new Date(), 24)

      await (supabase
        .from('reservations') as any)
        .update({
          reservation_status: 'approved',
          payment_deadline: paymentDeadline.toISOString(),
          stripe_payment_link_id: paymentLink.id,
          stripe_payment_link_url: paymentLink.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)

      // Email the guest
      const emailHtml = guestBookingApproved({
        experienceTitle: experience.title,
        guestName: reservation.guest_name,
        date: session.session_date,
        time: session.start_time,
        participants: reservation.participants,
        totalCents: reservation.total_cents,
        currency: experience.currency,
        paymentUrl: paymentLink.url!,
        meetingPoint: experience.meeting_point,
        paymentDeadline: paymentDeadline.toISOString(),
      })

      await sendEmail({
        to: reservation.guest_email,
        subject: `Your booking is confirmed! Complete payment — ${experience.title}`,
        html: emailHtml,
      })

      approved++
      console.log(`Auto-approved reservation ${reservation.id} for session ${sessionId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Reservation ${reservation.id}: ${msg}`)
      console.error(`Failed to auto-approve reservation ${reservation.id}:`, err)
    }
  }

  return { approved, errors }
}
