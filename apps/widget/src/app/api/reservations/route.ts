import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateAcceptToken, generateDeclineToken } from '@/lib/tokens'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { 
  supplierNewRequest,
  guestInstantBooking,
  supplierNewBooking,
  guestSpotReserved,
  supplierNewReservation,
} from '@/lib/email/templates'
import { calculatePrice } from '@/lib/pricing'
import { createPaymentLink } from '@/lib/stripe'
import { autoApprovePendingMinimum } from '@/lib/auto-approve'
import { addHours } from 'date-fns'

export async function POST(request: NextRequest) {
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
    } = body
    
    // Validate required fields
    if (!hotelSlug || !experienceId || !participants || !totalCents || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
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
    // min_participants is a session-level threshold (min to run), not a per-booking limit
    if (participants < 1 || participants > experience.max_participants) {
      return NextResponse.json(
        { error: `Participants must be between 1 and ${experience.max_participants}` },
        { status: 400 }
      )
    }
    
    // If session-based, verify session availability
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
      
      if (session.spots_available < participants) {
        return NextResponse.json(
          { error: 'Not enough spots available' },
          { status: 400 }
        )
      }
      
      sessionData = session
      date = session.session_date
      time = session.start_time
    }
    
    // Recalculate price to ensure it's correct
    const calculatedPrice = calculatePrice(experience, participants, sessionData)
    const expectedTotal = calculatedPrice.totalPrice
    
    // Verify the total matches (allow small rounding differences)
    if (Math.abs(totalCents - expectedTotal) > 1) {
      return NextResponse.json(
        { error: 'Price mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }
    
    const appUrl = getAppUrl()
    
    // =========================================================================
    // SESSION-BASED BOOKING: Guest picked existing session
    // If min_participants > 1 and threshold not yet met, create pending_minimum
    // reservation (no payment). Otherwise, direct payment flow.
    // =========================================================================
    if (!isRequest && sessionId && sessionData) {
      const minToRun = experience.min_participants || 1
      const bookedSoFar = sessionData.spots_total - sessionData.spots_available
      const bookedAfter = bookedSoFar + participants
      const thresholdMet = minToRun <= 1 || bookedAfter >= minToRun

      // Hold spots by deducting them immediately (will be released if payment fails or min not met)
      const newSpotsAvailable = sessionData.spots_available - participants
      
      await (supabase
        .from('experience_sessions') as any)
        .update({
          spots_available: newSpotsAvailable,
          session_status: newSpotsAvailable === 0 ? 'full' : 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      // -----------------------------------------------------------------------
      // BELOW THRESHOLD: Reserve spot without payment (pending_minimum)
      // -----------------------------------------------------------------------
      if (!thresholdMet) {
        const responseDeadline = addHours(new Date(), 48) // placeholder for required field
        
        const { data: reservation, error: reservationError } = await (supabase
          .from('reservations') as any)
          .insert({
            experience_id: experienceId,
            hotel_id: hotel.partner_id,
            session_id: sessionId,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone || null,
            participants,
            total_cents: expectedTotal,
            is_request: false,
            reservation_status: 'pending_minimum',
            response_deadline: responseDeadline.toISOString(),
          })
          .select()
          .single()
        
        if (reservationError || !reservation) {
          console.error('Failed to create pending_minimum reservation:', reservationError)
          // Rollback spots deduction
          await (supabase
            .from('experience_sessions') as any)
            .update({
              spots_available: sessionData.spots_available,
              session_status: sessionData.session_status,
            })
            .eq('id', sessionId)
          return NextResponse.json(
            { error: 'Failed to create reservation' },
            { status: 500 }
          )
        }

        // Email guest: "spot reserved, waiting for minimum"
        const guestEmailHtml = guestSpotReserved({
          experienceTitle: experience.title,
          guestName,
          date: date || '',
          time,
          participants,
          totalCents: expectedTotal,
          currency: experience.currency,
          minParticipants: minToRun,
          bookedSoFar: bookedAfter,
          reservationPageUrl: `${appUrl}/${hotelSlug}/reservation/${reservation.id}`,
        })

        await sendEmail({
          to: guestEmail,
          subject: `Spot reserved — ${experience.title}`,
          html: guestEmailHtml,
        })

        // Email supplier: "new reservation toward minimum"
        const dashboardUrl = 'https://dashboard.traverum.com/supplier/sessions'
        const supplierEmailHtml = supplierNewReservation({
          experienceTitle: experience.title,
          guestName,
          guestEmail,
          guestPhone,
          date: date || '',
          time,
          participants,
          totalCents: expectedTotal,
          currency: experience.currency,
          minParticipants: minToRun,
          bookedSoFar: bookedAfter,
          hotelName: hotel.display_name,
          dashboardUrl,
        })

        await sendEmail({
          to: experience.supplier.email,
          subject: `New reservation (${bookedAfter}/${minToRun} min) — ${experience.title}`,
          html: supplierEmailHtml,
          replyTo: guestEmail,
        })

        return NextResponse.json({
          success: true,
          reservationId: reservation.id,
          pendingMinimum: true,
        })
      }

      // -----------------------------------------------------------------------
      // THRESHOLD MET: Normal payment flow for this guest
      // -----------------------------------------------------------------------
      const paymentDeadline = addHours(new Date(), 24)
      
      const { data: reservation, error: reservationError } = await (supabase
        .from('reservations') as any)
        .insert({
          experience_id: experienceId,
          hotel_id: hotel.partner_id,
          session_id: sessionId,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone || null,
          participants,
          total_cents: expectedTotal,
          is_request: false,
          reservation_status: 'approved', // Payment is immediate, so approved
          payment_deadline: paymentDeadline.toISOString(),
          response_deadline: paymentDeadline.toISOString(), // Required field
        })
        .select()
        .single()
      
      if (reservationError || !reservation) {
        console.error('Failed to create reservation:', reservationError)
        // Rollback spots deduction
        await (supabase
          .from('experience_sessions') as any)
          .update({
            spots_available: sessionData.spots_available,
            session_status: sessionData.session_status,
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
        cancelUrl: `${appUrl}/${hotelSlug}`, // Cancel goes back to hotel page
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

      // If this booking tipped the threshold, auto-approve any pending_minimum reservations
      if (minToRun > 1 && bookedSoFar < minToRun) {
        // There were pending_minimum reservations before this one tipped the balance
        const result = await autoApprovePendingMinimum(sessionId)
        console.log(`Auto-approved ${result.approved} pending_minimum reservations for session ${sessionId}`)
        if (result.errors.length > 0) {
          console.error('Auto-approve errors:', result.errors)
        }
      }
      
      // Return payment URL for immediate redirect (user never sees reservation page)
      return NextResponse.json({
        success: true,
        paymentUrl: paymentLink.url, // Direct redirect to payment
        bookingId: reservation.id, // For confirmation page reference
      })
    }
    
    // =========================================================================
    // REQUEST-BASED BOOKING: Guest requested custom date/time, needs approval
    // =========================================================================
    const responseDeadline = addHours(new Date(), 48)
    
    const { data: reservation, error: reservationError } = await (supabase
      .from('reservations') as any)
      .insert({
        experience_id: experienceId,
        hotel_id: hotel.partner_id,
        session_id: sessionId || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        participants,
        total_cents: expectedTotal,
        is_request: true,
        requested_date: requestDate || null,
        requested_time: requestTime ? (requestTime.length === 5 ? `${requestTime}:00` : requestTime) : null,
        time_preference: null,
        reservation_status: 'pending',
        response_deadline: responseDeadline.toISOString(),
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
    
    // NOTE: No guest email sent before payment (Phase 2 decision - no emails before payment)
    
    // Send email to supplier (with accept/decline buttons)
    const dashboardUrl = 'https://dashboard.traverum.com/supplier/sessions'
    // Build manage page URL for the supplier
    const manageUrl = `${appUrl}/request/${reservation.id}/respond?at=${acceptToken}&dt=${declineToken}`

    const supplierEmailHtml = supplierNewRequest({
      experienceTitle: experience.title,
      guestName,
      guestEmail,
      guestPhone,
      date: date || '',
      time: requestTime || null,
      participants,
      totalCents: expectedTotal,
      currency: experience.currency,
      acceptUrl,
      declineUrl,
      manageUrl,
      hotelName: hotel.display_name,
      dashboardUrl,
    })
    
    await sendEmail({
      to: experience.supplier.email,
      subject: `New booking request - ${experience.title}`,
      html: supplierEmailHtml,
      replyTo: guestEmail,
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
