import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateAcceptToken, generateDeclineToken } from '@/lib/tokens'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { 
  supplierNewRequest,
  guestInstantBooking,
  supplierNewBooking,
} from '@/lib/email/templates'
import { calculatePrice } from '@/lib/pricing'
import { createPaymentLink } from '@/lib/stripe'
import { sanitizeGuestText, sanitizeGuestEmail } from '@/lib/sanitize'
import { reservationLimiter, getClientIp } from '@/lib/rate-limit'
import { addHours } from 'date-fns'

export async function POST(request: NextRequest) {
  // Rate limiting — skip in development if KV is not configured
  if (process.env.KV_REST_API_URL) {
    const ip = getClientIp(request)
    const { success } = await reservationLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }

  try {
    const body = await request.json()
    
    const {
      hotelSlug,
      experienceId,
      sessionId,
      participants,
      totalCents,
      isRequest,
      requestDate,
      requestTime,
      guestName,
      guestEmail,
      guestPhone,
      preferredLanguage,
      rentalDays: rentalDaysParam,
      quantity,
    } = body
    
    // Validate required fields
    if (!hotelSlug || !experienceId || !participants || !totalCents || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Sanitize guest input to prevent XSS / HTML injection
    const cleanName = sanitizeGuestText(guestName)
    let cleanEmail: string
    try {
      cleanEmail = sanitizeGuestEmail(guestEmail)
    } catch {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    const cleanPhone = guestPhone ? sanitizeGuestText(guestPhone, 30) : null
    
    const supabase = createAdminClient()
    
    // Get hotel config
    const { data: hotelData } = await supabase
      .from('hotel_configs')
      .select('*, partner:partners!hotel_configs_partner_fk(*)')
      .eq('slug', hotelSlug)
      .eq('is_active', true)
      .single()
    
    if (!hotelData) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }
    
    const hotel = hotelData as any
    
    // Get experience with supplier
    const { data: experienceData } = await supabase
      .from('experiences')
      .select('*, supplier:partners!experiences_partner_fk(*)')
      .eq('id', experienceId)
      .single()
    
    if (!experienceData) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      )
    }
    
    const experience = experienceData as any
    
    // Validate participants against experience limits
    const isRental = experience.pricing_type === 'per_day'
    if (!isRental && (participants < 1 || participants > experience.max_participants)) {
      return NextResponse.json(
        { error: `Participants must be between 1 and ${experience.max_participants}` },
        { status: 400 }
      )
    }

    // Per-day rental validation
    const rentalDays = isRental ? (Number(rentalDaysParam) || 0) : 0
    if (isRental) {
      if (!requestDate) {
        return NextResponse.json(
          { error: 'Rental start date is required' },
          { status: 400 }
        )
      }
      if (rentalDays < 1) {
        return NextResponse.json(
          { error: 'Number of rental days is required' },
          { status: 400 }
        )
      }
      const minDays = experience.min_days || 1
      const maxDays = experience.max_days || null
      if (rentalDays < minDays) {
        return NextResponse.json(
          { error: `Minimum rental period is ${minDays} days` },
          { status: 400 }
        )
      }
      if (maxDays && rentalDays > maxDays) {
        return NextResponse.json(
          { error: `Maximum rental period is ${maxDays} days` },
          { status: 400 }
        )
      }
    }
    
    // If session-based, verify session is available
    let sessionData = null
    let date = requestDate
    let time: string | null = null
    
    if (sessionId) {
      const { data: sessionResult } = await supabase
        .from('experience_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (!sessionResult) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }
      
      const session = sessionResult as any
      
      // Session must be available (one group per session)
      if (session.session_status !== 'available') {
        return NextResponse.json(
          { error: 'Session is no longer available' },
          { status: 400 }
        )
      }
      
      sessionData = session
      date = session.session_date
      time = session.start_time
    }
    
    // Recalculate price to ensure it's correct
    const calculatedPrice = isRental
      ? calculatePrice(experience, quantity || 1, null, rentalDays, quantity || 1)
      : calculatePrice(experience, participants, sessionData)
    const expectedTotal = calculatedPrice.totalPrice
    
    // Verify the total matches (allow small rounding differences)
    if (Math.abs(totalCents - expectedTotal) > 1) {
      return NextResponse.json(
        { error: 'Price mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }
    
    const appUrl = getAppUrl()
    
    // Compute rental end date from start + days for storage
    let rentalEndDate: string | null = null
    if (isRental && requestDate && rentalDays > 0) {
      const startDate = new Date(requestDate + 'T12:00:00')
      startDate.setDate(startDate.getDate() + rentalDays)
      rentalEndDate = startDate.toISOString().slice(0, 10)
    }

    // =========================================================================
    // SESSION-BASED BOOKING: Guest picked existing session
    // One group per session — claim it immediately, then redirect to payment.
    // =========================================================================
    if (!isRequest && sessionId && sessionData) {
      // Claim the session (mark as booked — no longer visible in widget)
      await (supabase
        .from('experience_sessions') as any)
        .update({
          session_status: 'booked',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      const paymentDeadline = addHours(new Date(), 24)
      
      const { data: reservation, error: reservationError } = await (supabase
        .from('reservations') as any)
        .insert({
          experience_id: experienceId,
          hotel_id: hotel.partner_id,
          session_id: sessionId,
          guest_name: cleanName,
          guest_email: cleanEmail,
          guest_phone: cleanPhone,
          participants,
          total_cents: expectedTotal,
          is_request: false,
          reservation_status: 'approved',
          payment_deadline: paymentDeadline.toISOString(),
          response_deadline: paymentDeadline.toISOString(), // Required field
          preferred_language: preferredLanguage || sessionData?.session_language || null,
        })
        .select()
        .single()
      
      if (reservationError || !reservation) {
        console.error('Failed to create reservation:', reservationError)
        // Rollback session status
        await (supabase
          .from('experience_sessions') as any)
          .update({
            session_status: 'available',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
        return NextResponse.json(
          { error: 'Failed to create reservation' },
          { status: 500 }
        )
      }
      
      // Create payment link immediately - user goes straight to payment
      const paymentLink = await createPaymentLink({
        reservationId: reservation.id,
        experienceTitle: experience.title,
        amountCents: expectedTotal,
        currency: experience.currency,
        successUrl: `${appUrl}/${hotelSlug}/confirmation/${reservation.id}`,
        cancelUrl: `${appUrl}/${hotelSlug}`,
      })
      
      // Update reservation with payment link
      await (supabase
        .from('reservations') as any)
        .update({
          stripe_payment_link_id: paymentLink.id,
          stripe_payment_link_url: paymentLink.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id)
      
      // Return payment URL for immediate redirect (user never sees reservation page)
      return NextResponse.json({
        success: true,
        paymentUrl: paymentLink.url,
        bookingId: reservation.id,
      })
    }
    
    // =========================================================================
    // REQUEST-BASED BOOKING: Guest requested custom date/time, needs approval
    // Also handles rental requests (per_day pricing)
    // =========================================================================
    const responseDeadline = addHours(new Date(), 48)
    
    const { data: reservation, error: reservationError } = await (supabase
      .from('reservations') as any)
      .insert({
        experience_id: experienceId,
        hotel_id: hotel.partner_id,
        session_id: sessionId || null,
        guest_name: cleanName,
        guest_email: cleanEmail,
        guest_phone: cleanPhone,
        participants: isRental ? (quantity || 1) : participants,
        total_cents: expectedTotal,
        is_request: true,
        requested_date: requestDate || null,
        requested_time: isRental ? null : (requestTime ? (requestTime.length === 5 ? `${requestTime}:00` : requestTime) : null),
        time_preference: null,
        reservation_status: 'pending',
        response_deadline: responseDeadline.toISOString(),
        preferred_language: preferredLanguage || null,
        ...(isRental ? {
          rental_start_date: requestDate,
          rental_end_date: rentalEndDate,
        } : {}),
      })
      .select()
      .single()
    
    if (reservationError || !reservation) {
      console.error('Failed to create reservation:', reservationError)
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      )
    }
    
    // Generate tokens for supplier actions
    const acceptToken = generateAcceptToken(reservation.id)
    const declineToken = generateDeclineToken(reservation.id)
    
    const acceptUrl = `${appUrl}/api/reservations/${reservation.id}/accept?token=${acceptToken}`
    const declineUrl = `${appUrl}/api/reservations/${reservation.id}/decline?token=${declineToken}`
    
    // Send email to supplier (with accept/decline buttons)
    const dashboardUrl = 'https://dashboard.traverum.com/supplier/sessions'
    const manageUrl = `${appUrl}/request/${reservation.id}/respond?at=${acceptToken}&dt=${declineToken}`

    const supplierEmailHtml = supplierNewRequest({
      experienceTitle: experience.title,
      guestName: cleanName,
      date: requestDate || date || '',
      time: isRental ? null : (requestTime || null),
      participants: isRental ? (quantity || 1) : participants,
      totalCents: expectedTotal,
      currency: experience.currency,
      acceptUrl,
      declineUrl,
      manageUrl,
      hotelName: hotel.display_name,
      dashboardUrl,
      ...(isRental ? { rentalEndDate: rentalEndDate || undefined, rentalDays } : {}),
    })

    await sendEmail({
      to: experience.supplier.email,
      subject: isRental ? `New rental request - ${experience.title}` : `New booking request - ${experience.title}`,
      html: supplierEmailHtml,
    })
    
    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
    })
  } catch (error) {
    console.error('Reservation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
