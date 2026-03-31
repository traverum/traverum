import { redirect } from 'next/navigation'
import { getReceptionistContext } from '@/lib/receptionist/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { BookingsClient } from './BookingsClient'

export default async function ReceptionistBookingsPage() {
  const result = await getReceptionistContext()

  if (!result.success) {
    redirect('/receptionist/login')
  }

  const { hotelConfig } = result.data
  const supabase = createAdminClient()

  // All bookings made via the receptionist tool for the active property
  const { data: reservations } = await (supabase
    .from('reservations') as any)
    .select(`
      id,
      guest_name,
      guest_email,
      guest_phone,
      participants,
      total_cents,
      reservation_status,
      is_request,
      created_at,
      session_id,
      requested_date,
      requested_time,
      payment_deadline,
      stripe_payment_link_url,
      source,
      booked_by_user_id,
      booker:users!reservations_booked_by_user_id_fkey (email),
      experience:experiences!reservations_experience_fk (
        id,
        title,
        slug,
        currency
      ),
      session:experience_sessions!reservations_session_id_fkey (
        session_date,
        start_time
      )
    `)
    .eq('source', 'receptionist')
    .eq('hotel_config_id', hotelConfig.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Also check for bookings (confirmed payments) for these reservations
  const reservationIds = (reservations || []).map((r: any) => r.id)
  let bookingsMap: Record<string, any> = {}

  if (reservationIds.length > 0) {
    const { data: bookings } = await (supabase
      .from('bookings') as any)
      .select('id, reservation_id, booking_status')
      .in('reservation_id', reservationIds)

    for (const b of (bookings || [])) {
      bookingsMap[b.reservation_id] = b
    }
  }

  const enriched = (reservations || []).map((r: any) => {
    const booking = bookingsMap[r.id]
    const date = r.session?.session_date || r.requested_date || null
    const time = r.session?.start_time || r.requested_time || null

    let displayStatus: string
    if (booking) {
      displayStatus = booking.booking_status === 'completed'
        ? 'completed'
        : booking.booking_status === 'cancelled'
          ? 'cancelled'
          : 'confirmed'
    } else if (r.reservation_status === 'approved') {
      displayStatus = 'awaiting_payment'
    } else if (r.reservation_status === 'pending') {
      displayStatus = 'request_pending'
    } else if (r.reservation_status === 'declined') {
      displayStatus = 'declined'
    } else if (r.reservation_status === 'expired') {
      displayStatus = 'expired'
    } else {
      displayStatus = r.reservation_status
    }

    return {
      id: r.id,
      guestName: r.guest_name,
      guestEmail: r.guest_email,
      guestPhone: r.guest_phone,
      participants: r.participants,
      totalCents: r.total_cents,
      currency: r.experience?.currency || 'EUR',
      experienceTitle: r.experience?.title || 'Unknown',
      date,
      time,
      status: displayStatus,
      isRequest: r.is_request,
      paymentUrl: r.stripe_payment_link_url,
      createdAt: r.created_at,
      bookedBy: r.booker?.email || null,
    }
  })

  return <BookingsClient bookings={enriched} />
}
