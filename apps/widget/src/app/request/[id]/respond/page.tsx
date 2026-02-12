import { createAdminClient } from '@/lib/supabase/server'
import { verifyToken } from '@/lib/tokens'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import { RespondClient } from './RespondClient'

export const dynamic = 'force-dynamic'

interface RespondPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ at?: string; dt?: string }>
}

export default async function RespondPage({ params, searchParams }: RespondPageProps) {
  const { id } = await params
  const { at: acceptToken, dt: declineToken } = await searchParams

  // Verify at least one token is valid for this reservation
  let isValid = false

  if (acceptToken) {
    const payload = verifyToken(acceptToken)
    if (payload && payload.id === id && payload.action === 'accept') {
      isValid = true
    }
  }
  if (!isValid && declineToken) {
    const payload = verifyToken(declineToken)
    if (payload && payload.id === id && payload.action === 'decline') {
      isValid = true
    }
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-500 text-sm">This link has expired or is invalid. Please check your email for a fresh link.</p>
        </div>
      </div>
    )
  }

  // Fetch reservation with related data
  const supabase = createAdminClient()

  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(id, title, slug, currency, duration_minutes, meeting_point),
      session:experience_sessions(session_date, start_time)
    `)
    .eq('id', id)
    .single()

  if (!reservationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Not Found</h1>
          <p className="text-gray-500 text-sm">This booking request could not be found.</p>
        </div>
      </div>
    )
  }

  const reservation = reservationData as any
  const experience = reservation.experience
  const date = reservation.session?.session_date || reservation.requested_date || ''
  const time = reservation.session?.start_time || reservation.requested_time || ''

  // Already processed
  if (reservation.reservation_status !== 'pending') {
    const statusMessages: Record<string, { title: string; message: string; color: string }> = {
      approved: { title: 'Already Accepted', message: 'This request has been accepted. The guest has been sent a payment link.', color: 'green' },
      declined: { title: 'Already Declined', message: 'This request has been declined. The guest has been notified.', color: 'gray' },
      expired: { title: 'Request Expired', message: 'This request has expired because no response was given within 48 hours.', color: 'amber' },
    }
    const status = statusMessages[reservation.reservation_status] || {
      title: 'Processed',
      message: 'This request has already been processed.',
      color: 'gray',
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            status.color === 'green' ? 'bg-green-50' : status.color === 'amber' ? 'bg-amber-50' : 'bg-gray-100'
          }`}>
            <svg className={`w-8 h-8 ${
              status.color === 'green' ? 'text-green-500' : status.color === 'amber' ? 'text-amber-500' : 'text-gray-400'
            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{status.title}</h1>
          <p className="text-gray-500 text-sm">{status.message}</p>
        </div>
      </div>
    )
  }

  // Build serialized data for client component
  const requestData = {
    id: reservation.id,
    experienceTitle: experience.title,
    guestName: reservation.guest_name,
    date: date ? formatDate(date, { short: true }) : '',
    time: time ? formatTime(time) : '',
    rawTime: time || '',
    participants: reservation.participants,
    totalFormatted: formatPrice(reservation.total_cents, experience.currency),
    responseDeadline: reservation.response_deadline,
  }

  return (
    <RespondClient
      data={requestData}
      reservationId={id}
      acceptToken={acceptToken || ''}
      declineToken={declineToken || ''}
    />
  )
}
