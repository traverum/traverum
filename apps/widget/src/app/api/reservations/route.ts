import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateAcceptToken, generateDeclineToken } from '@/lib/tokens'
import { sendEmail, getAppUrl } from '@/lib/email/index'
import { 
  guestRequestReceived, 
  supplierNewRequest,
  guestInstantBooking,
  supplierNewBooking,
} from '@/lib/email/templates'
import { calculatePrice } from '@/lib/pricing'
import { createPaymentLink } from '@/lib/stripe'
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
      .select('*, partner:partners!hotel_configs_partner_id_fkey(*)')
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
      .select('*, supplier:partners!experiences_partner_id_fkey(*)')
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
    if (participants < experience.min_participants || participants > experience.max_participants) {
      return NextResponse.json(
        { error: `Participants must be between ${experience.min_participants} and ${experience.max_participants}` },
        { status: 400 }
      )
    }
    
    // If session-based, verify session availability
    let sessionData = null
    let date = requestDate
    let time = requestTime
    
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
    // SESSION-BASED BOOKING: Guest picked existing session, pay immediately
    // Direct payment flow - no reservation step shown to user
    // =========================================================================
    if (!isRequest && sessionId && sessionData) {
      // Hold spots by deducting them immediately (will be released if payment fails)
      const newSpotsAvailable = sessionData.spots_available - participants
      
      await (supabase
        .from('experience_sessions') as any)
        .update({
          spots_available: newSpotsAvailable,
          session_status: newSpotsAvailable === 0 ? 'full' : 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
      
      // Create minimal reservation for data integrity (user doesn't see this)
      // Status is 'approved' since payment is immediate
      const paymentDeadline = addHours(new Date(), 24)
      
      const { data: reservation, error: reservationError } = await (supabase
        .from('reservations') as any)
        .insert({
          experience_id: experienceId,
          hotel_id: hotel.partner_id,
          hotel_config_id: hotel.id,
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
        hotel_config_id: hotel.id,
        session_id: sessionId || null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        participants,
        total_cents: expectedTotal,
        is_request: true,
        requested_date: requestDate || null,
        requested_time: requestTime || null,
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
    
    // Send email to guest (waiting for confirmation)
    const guestEmailHtml = guestRequestReceived({
      experienceTitle: experience.title,
      guestName,
      date: date || '',
      time: time || '',
      participants,
      totalCents: expectedTotal,
      currency: experience.currency,
      hotelName: hotel.display_name,
    })
    
    await sendEmail({
      to: guestEmail,
      subject: `Booking request received - ${experience.title}`,
      html: guestEmailHtml,
    })
    
    // Send email to supplier (with accept/decline buttons)
    const supplierEmailHtml = supplierNewRequest({
      experienceTitle: experience.title,
      guestName,
      guestEmail,
      guestPhone,
      date: date || '',
      time: time || '',
      participants,
      totalCents: expectedTotal,
      currency: experience.currency,
      acceptUrl,
      declineUrl,
      hotelName: hotel.display_name,
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
