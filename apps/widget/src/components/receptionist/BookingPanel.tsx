'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { calculatePrice } from '@/lib/pricing'
import { formatPrice, formatDuration, formatDate, formatTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface BookingPanelProps {
  experience: ReceptionistExperience
  hotelSlug: string
  hotelName: string
  userId: string
  onClose: () => void
  onComplete: () => void
}

interface Session {
  id: string
  session_date: string
  start_time: string
  session_status: string
  session_language: string | null
  price_override_cents: number | null
}

type BookingState = 'form' | 'submitting' | 'success'

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'Free cancellation up to 24 hours before',
  moderate: 'Free cancellation up to 7 days before',
}

export function BookingPanel({ experience, hotelSlug, hotelName, userId, onClose, onComplete }: BookingPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [useRequest, setUseRequest] = useState(false)
  const [requestDate, setRequestDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [participants, setParticipants] = useState(experience.min_participants || 2)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [bookingState, setBookingState] = useState<BookingState>('form')
  const [error, setError] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch available sessions for this experience
  useEffect(() => {
    let cancelled = false
    setSessionsLoading(true)
    setSessions([])
    setSelectedSessionId(null)
    setUseRequest(false)

    const fetchSessions = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().slice(0, 10)

      const { data } = await supabase
        .from('experience_sessions')
        .select('id, session_date, start_time, session_status, session_language, price_override_cents')
        .eq('experience_id', experience.id)
        .eq('session_status', 'available')
        .gte('session_date', today)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20) as { data: Session[] | null }

      if (!cancelled) {
        setSessions(data || [])
        setSessionsLoading(false)
      }
    }

    fetchSessions()
    return () => { cancelled = true }
  }, [experience.id])

  const selectedSession = useMemo(
    () => sessions.find(s => s.id === selectedSessionId) || null,
    [sessions, selectedSessionId]
  )

  const priceCalc = useMemo(() => {
    return calculatePrice(experience, participants, selectedSession)
  }, [experience, participants, selectedSession])

  const canSubmit =
    guestName.trim() &&
    guestEmail.trim() &&
    (selectedSessionId || (useRequest && requestDate)) &&
    participants >= (experience.min_participants || 1) &&
    participants <= experience.max_participants

  const handleSubmit = async () => {
    if (!canSubmit) return
    setBookingState('submitting')
    setError(null)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          experienceId: experience.id,
          sessionId: selectedSessionId || undefined,
          participants,
          totalCents: priceCalc.totalPrice,
          isRequest: useRequest,
          requestDate: useRequest ? requestDate : undefined,
          requestTime: useRequest ? requestTime || undefined : undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || undefined,
          source: 'receptionist',
          bookedByUserId: userId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create booking')
        setBookingState('form')
        return
      }

      setPaymentUrl(data.paymentUrl || null)
      setBookingId(data.bookingId || data.reservationId || null)
      setBookingState('success')
    } catch {
      setError('Network error. Please try again.')
      setBookingState('form')
    }
  }

  const handleCopyLink = async () => {
    if (!paymentUrl) return
    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard may not be available */ }
  }

  const mapsUrl = useMemo(() => {
    if (!experience.location) return null
    const loc = experience.location as any
    if (loc?.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${loc.coordinates[1]},${loc.coordinates[0]}`
    }
    if (experience.location_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(experience.location_address)}`
    }
    return null
  }, [experience.location, experience.location_address])

  const whatsappUrl = useMemo(() => {
    if (!experience.supplier.phone) return null
    const phone = experience.supplier.phone.replace(/[^+\d]/g, '')
    const msg = encodeURIComponent(
      `Hi, I'm calling from ${hotelName} regarding "${experience.title}". I have a guest interested in this experience.`
    )
    return `https://wa.me/${phone}?text=${msg}`
  }, [experience.supplier.phone, hotelName, experience.title])

  // Success state
  if (bookingState === 'success') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {useRequest ? 'Request Sent' : 'Booking Created'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {useRequest
              ? `Request sent to ${experience.supplier.name}. The guest will be contacted to confirm.`
              : `Payment link sent to ${guestEmail}`}
          </p>
        </div>

        {paymentUrl && (
          <div className="mt-5 space-y-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2 px-4 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Payment Link'}
            </button>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 px-4 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              Open Payment Page
            </a>
          </div>
        )}

        <button
          onClick={onComplete}
          className="w-full mt-4 py-2 px-4 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Book Another Experience
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{experience.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{experience.supplier.name}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-5 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {/* What to tell the guest */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            What to tell the guest
          </h3>
          <p className="text-sm text-gray-700 line-clamp-4">{experience.description}</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
            <div>
              <span className="text-gray-500">Duration:</span>{' '}
              <span className="text-gray-900">{formatDuration(experience.duration_minutes)}</span>
            </div>
            <div>
              <span className="text-gray-500">Group size:</span>{' '}
              <span className="text-gray-900">{experience.min_participants}–{experience.max_participants}</span>
            </div>
            {experience.available_languages.length > 0 && (
              <div>
                <span className="text-gray-500">Languages:</span>{' '}
                <span className="text-gray-900">{experience.available_languages.join(', ')}</span>
              </div>
            )}
            {experience.cancellation_policy && (
              <div className="col-span-2">
                <span className="text-gray-500">Cancellation:</span>{' '}
                <span className="text-gray-900">
                  {CANCELLATION_LABELS[experience.cancellation_policy] || experience.cancellation_policy}
                </span>
              </div>
            )}
          </div>

          {(experience.meeting_point || experience.location_address) && (
            <div className="mt-3 flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span className="text-gray-900">
                  {experience.meeting_point || experience.location_address}
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 hover:underline text-xs mt-0.5"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Notes for Hotels */}
        {experience.hotel_notes && (
          <section className="bg-amber-50 border border-amber-100 rounded-md p-3">
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
              Notes for Hotels
            </h3>
            <p className="text-sm text-amber-900 whitespace-pre-line">{experience.hotel_notes}</p>
          </section>
        )}

        {/* Provider Contact */}
        <section className="flex flex-wrap gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.528-1.472A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.308-.724-5.993-1.953l-.42-.307-2.693.876.896-2.632-.336-.436A9.933 9.933 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {experience.supplier.phone && (
            <a
              href={`tel:${experience.supplier.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          {experience.supplier.email && (
            <a
              href={`mailto:${experience.supplier.email}?subject=${encodeURIComponent(`Guest inquiry: ${experience.title}`)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          )}
        </section>

        <hr className="border-gray-100" />

        {/* Session Picker */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Select Date & Time
          </h3>

          {sessionsLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-9 w-28 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedSessionId(s.id); setUseRequest(false) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    selectedSessionId === s.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {formatDate(s.session_date, { short: true })} {formatTime(s.start_time)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming sessions available.</p>
          )}

          {experience.allows_requests && (
            <button
              onClick={() => { setUseRequest(true); setSelectedSessionId(null) }}
              className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                useRequest
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
            >
              Request custom time
            </button>
          )}

          {sessions.length === 0 && !experience.allows_requests && (
            <p className="text-xs text-gray-400 mt-1">
              This experience doesn&apos;t have sessions or custom requests enabled.
            </p>
          )}

          {useRequest && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={e => setRequestDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preferred time</label>
                <input
                  type="time"
                  value={requestTime}
                  onChange={e => setRequestTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </section>

        {/* Participants */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Participants
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setParticipants(p => Math.max(experience.min_participants || 1, p - 1))}
              disabled={participants <= (experience.min_participants || 1)}
              className="w-8 h-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              -
            </button>
            <span className="text-lg font-semibold text-gray-900 w-8 text-center">{participants}</span>
            <button
              onClick={() => setParticipants(p => Math.min(experience.max_participants, p + 1))}
              disabled={participants >= experience.max_participants}
              className="w-8 h-8 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-lg"
            >
              +
            </button>
            <span className="text-sm text-gray-500">
              {formatPrice(priceCalc.totalPrice, experience.currency)} total
            </span>
          </div>
        </section>

        {/* Guest Info */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Guest Details
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Guest name *"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Guest email *"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Guest phone (optional)"
              value={guestPhone}
              onChange={e => setGuestPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || bookingState === 'submitting'}
          className="w-full py-2.5 px-4 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {bookingState === 'submitting'
            ? 'Creating booking...'
            : useRequest
              ? 'Send Request to Provider'
              : `Send Payment Link · ${formatPrice(priceCalc.totalPrice, experience.currency)}`}
        </button>
      </div>
    </div>
  )
}
