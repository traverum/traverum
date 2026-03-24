'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ReceptionistExperience } from '@/lib/receptionist/experiences'
import { calculatePrice } from '@/lib/pricing'
import { formatPrice, formatDuration } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { SessionPicker } from '@/components/SessionPicker'
import { ParticipantSelector } from '@/components/ParticipantSelector'
import type { ExperienceSession } from '@/lib/supabase/types'
import { Check, X, MapPin, Phone, Mail, ExternalLink, MessageCircle, Copy, ChevronRight } from 'lucide-react'

interface BookingPanelProps {
  experience: ReceptionistExperience
  hotelSlug: string
  hotelName: string
  userId: string
  appUrl: string
  initialGuestName?: string
  initialGuestEmail?: string
  initialGuestPhone?: string
  onClose: () => void
  onComplete: (guestDetails: { name: string; email: string; phone: string }) => void
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
  flexible: 'Free cancellation up to 24h before',
  moderate: 'Free cancellation up to 7 days before',
}

/** Receptionist panel: one rhythm for section titles + field labels */
const formEyebrow = 'text-xs font-medium text-muted-foreground'
const insetCard = 'rounded-xl border border-border bg-muted/20'
const formInput =
  'w-full h-11 px-4 text-sm rounded-xl border border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors'

export function BookingPanel({
  experience,
  hotelSlug,
  hotelName,
  userId,
  appUrl,
  initialGuestName = '',
  initialGuestEmail = '',
  initialGuestPhone = '',
  onClose,
  onComplete,
}: BookingPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [useRequest, setUseRequest] = useState(false)
  const [requestDate, setRequestDate] = useState('')
  const [requestTime, setRequestTime] = useState('')
  const [participants, setParticipants] = useState(experience.min_participants || 2)
  const [rentalDate, setRentalDate] = useState('')
  const [rentalDays, setRentalDays] = useState(experience.min_days || 1)
  const [quantity, setQuantity] = useState(1)
  const [guestName, setGuestName] = useState(initialGuestName)
  const [guestEmail, setGuestEmail] = useState(initialGuestEmail)
  const [guestPhone, setGuestPhone] = useState(initialGuestPhone)
  const [bookingState, setBookingState] = useState<BookingState>('form')
  const [error, setError] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isRental = experience.pricing_type === 'per_day'

  useEffect(() => {
    let cancelled = false
    setSessionsLoading(true)
    setSessions([])
    setSelectedSessionId(null)
    setUseRequest(false)
    setRentalDate('')
    setRentalDays(experience.min_days || 1)
    setQuantity(1)

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
    return isRental
      ? calculatePrice(experience, quantity, null, rentalDays, quantity)
      : calculatePrice(experience, participants, selectedSession)
  }, [experience, isRental, participants, selectedSession, quantity, rentalDays])

  const canSubmit = useMemo(() => {
    if (!guestName.trim() || !guestEmail.trim()) return false
    if (isRental) {
      return !!rentalDate && quantity >= 1 && quantity <= experience.max_participants
    }
    return (
      (!!selectedSessionId || (useRequest && !!requestDate && !!requestTime)) &&
      participants >= (experience.min_participants || 1) &&
      participants <= experience.max_participants
    )
  }, [guestName, guestEmail, isRental, rentalDate, quantity, experience.max_participants, selectedSessionId, useRequest, requestDate, requestTime, participants, experience.min_participants])

  const handleSessionSelect = useCallback((sessionId: string | null, isCustom: boolean) => {
    setSelectedSessionId(sessionId)
    setUseRequest(isCustom)
    if (!isCustom) {
      setRequestDate('')
      setRequestTime('')
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard may not be available */ }
  }, [])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setBookingState('submitting')
    setError(null)

    try {
      const body: Record<string, unknown> = {
        hotelSlug,
        experienceId: experience.id,
        participants: isRental ? quantity : participants,
        totalCents: priceCalc.totalPrice,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim() || undefined,
        source: 'receptionist',
        bookedByUserId: userId,
      }
      if (isRental) {
        body.isRequest = true
        body.requestDate = rentalDate
        body.rentalDays = rentalDays
        body.quantity = quantity
      } else {
        body.sessionId = selectedSessionId || undefined
        body.isRequest = useRequest
        body.requestDate = useRequest ? requestDate : undefined
        body.requestTime = useRequest ? requestTime || undefined : undefined
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setBookingState('form')
        return
      }

      setPaymentUrl(data.paymentUrl || null)
      setBookingId(data.bookingId || data.reservationId || null)
      setBookingState('success')

      if (data.paymentUrl) {
        copyToClipboard(data.paymentUrl)
      }
    } catch {
      setError('Connection issue. Please try again.')
      setBookingState('form')
    }
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

  // Always Veyond direct URL: hotel widget may omit experiences not on their curated list
  const bookingSiteUrl = useMemo(() => {
    const base = appUrl.replace(/\/$/, '')
    const slug = experience.slug || experience.id
    return `${base}/experiences/${slug}`
  }, [appUrl, experience.id, experience.slug])

  if (bookingState === 'success') {
    return (
      <div className="bg-card rounded-2xl shadow-sm sticky top-6 p-6 sm:p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-light text-foreground">
            {useRequest ? 'Request Sent' : 'Booking Sent'}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {useRequest
              ? `Request sent to ${experience.supplier.name}`
              : `Payment link sent to ${guestEmail}`}
          </p>
        </div>

        {paymentUrl && (
          <button
            type="button"
            onClick={() => copyToClipboard(paymentUrl)}
            className="w-full mt-6 h-12 text-sm font-medium rounded-xl border border-border/50 text-foreground hover:bg-accent/5 transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        )}

        <button
          type="button"
          onClick={() => onComplete({ name: guestName, email: guestEmail, phone: guestPhone })}
          className="w-full mt-3 h-12 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Book Another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
      {experience.coverImage && (
        <div className="aspect-[5/2] overflow-hidden bg-muted">
          <img src={experience.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5 flex items-start justify-between gap-4 border-b border-foreground/[0.06]">
        <div className="min-w-0">
          <h2 className="text-lg font-light text-foreground leading-snug">{experience.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{experience.supplier.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted-foreground hover:text-foreground p-1.5 -mr-1.5 rounded-xl hover:bg-accent/5 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 pb-5 pt-5 space-y-6">
        {/* Reference — context before booking */}
        <div className="space-y-6">
        {/* Details — prose + structured facts (same card language as contact / preview) */}
        <section className="space-y-3">
          <p className={formEyebrow}>Details</p>
          <p className="text-sm text-foreground leading-relaxed">{experience.description}</p>
          <dl className={`${insetCard} divide-y divide-border`}>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,7.75rem)_1fr] gap-x-6 gap-y-0.5 px-4 py-3 sm:items-baseline">
              <dt className={formEyebrow}>Duration</dt>
              <dd className="text-sm text-foreground">{formatDuration(experience.duration_minutes)}</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,7.75rem)_1fr] gap-x-6 gap-y-0.5 px-4 py-3 sm:items-baseline">
              <dt className={formEyebrow}>Group size</dt>
              <dd className="text-sm text-foreground">
                {experience.min_participants}–{experience.max_participants} guests
              </dd>
            </div>
            {experience.available_languages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,7.75rem)_1fr] gap-x-6 gap-y-0.5 px-4 py-3 sm:items-baseline">
                <dt className={formEyebrow}>Languages</dt>
                <dd className="text-sm text-foreground">{experience.available_languages.join(', ')}</dd>
              </div>
            ) : null}
            {experience.cancellation_policy ? (
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,7.75rem)_1fr] gap-x-6 gap-y-0.5 px-4 py-3 sm:items-baseline">
                <dt className={formEyebrow}>Cancellation</dt>
                <dd className="text-sm text-foreground leading-snug">
                  {CANCELLATION_LABELS[experience.cancellation_policy] || experience.cancellation_policy}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        {experience.hotel_notes && (
          <section className="bg-accent/5 border border-accent/15 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-accent">Message from supplier</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{experience.hotel_notes}</p>
          </section>
        )}

        {/* Guest preview — same quiet row/card style as location + contact */}
        {bookingSiteUrl ? (
          <section className="space-y-2">
            <p className={formEyebrow}>Guest preview</p>
            <div className={`${insetCard} px-4`}>
              <a
                href={bookingSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-3 min-h-[44px] w-full text-left text-sm text-foreground hover:text-accent transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Open guest view</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" aria-hidden />
              </a>
            </div>
          </section>
        ) : null}

        {(experience.meeting_point || experience.location_address) ? (
          <section className="space-y-2">
            <p className={formEyebrow}>Experience location</p>
            <div className={`${insetCard} px-4`}>
              <div className="flex items-center gap-3 py-3 min-h-[44px]">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
                <span className="text-sm text-foreground min-w-0 flex-1 truncate">
                  {experience.meeting_point || experience.location_address}
                </span>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors flex-shrink-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded py-1 -my-1"
                  >
                    Maps
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" aria-hidden />
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {/* Contact supplier — phone + WhatsApp share one number; email row fixed below */}
        <section className="space-y-2">
          <p className={formEyebrow}>Contact supplier</p>
          <div className={`${insetCard} px-4 divide-y divide-border`}>
            <div className="flex items-center gap-3 py-3 min-h-[44px]">
              <Phone className={`w-4 h-4 flex-shrink-0 ${experience.supplier.phone ? 'text-muted-foreground' : 'text-muted-foreground opacity-50'}`} />
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {experience.supplier.phone ? (
                  <a
                    href={`tel:${experience.supplier.phone}`}
                    className="text-sm text-foreground hover:text-accent transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded min-w-0 truncate"
                  >
                    {experience.supplier.phone}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground tabular-nums" aria-label="No phone number">
                    —
                  </span>
                )}
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 flex-shrink-0 text-sm text-success hover:text-success/90 transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded py-1 -my-1"
                    aria-label="Open WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 min-h-[44px]">
              <Mail className={`w-4 h-4 flex-shrink-0 ${experience.supplier.email ? 'text-muted-foreground' : 'text-muted-foreground opacity-50'}`} />
              {experience.supplier.email ? (
                <a
                  href={`mailto:${experience.supplier.email}?subject=${encodeURIComponent(`Guest inquiry: ${experience.title}`)}`}
                  className="text-sm text-foreground hover:text-accent transition-colors touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded min-w-0 truncate"
                >
                  {experience.supplier.email}
                </a>
              ) : (
                <span className="text-sm text-muted-foreground tabular-nums" aria-label="No email">
                  —
                </span>
              )}
            </div>
          </div>
        </section>
        </div>

        {/* Booking — date, party, guest, submit */}
        <div className="space-y-6 pt-6 border-t border-border">
        {/* Date & time — same calendar + sessions / request flow as guest widget */}
        <section className="space-y-2">
          <p className={formEyebrow}>When</p>
          {sessionsLoading ? (
            <div className="h-[320px] w-full rounded-xl border border-border bg-muted/40 animate-pulse" />
          ) : (
            <SessionPicker
              sessions={sessions as ExperienceSession[]}
              selectedSessionId={selectedSessionId}
              isCustomRequest={useRequest}
              customDate={isRental ? rentalDate : requestDate}
              requestTime={requestTime}
              onSessionSelect={handleSessionSelect}
              onCustomDateChange={isRental ? setRentalDate : setRequestDate}
              onRequestTimeChange={setRequestTime}
              participants={isRental ? quantity : participants}
              availabilityRules={[]}
              mode={isRental ? 'rental' : 'session'}
              rentalDays={rentalDays}
              onRentalDaysChange={setRentalDays}
              minDays={experience.min_days || 1}
              maxDays={experience.max_days ?? undefined}
            />
          )}
        </section>

        {/* Participants / quantity — same selector as guest widget */}
        <section className="space-y-2">
          {isRental ? (
            <ParticipantSelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={experience.max_participants}
              label="Quantity"
              labelClassName={formEyebrow}
            />
          ) : (
            <ParticipantSelector
              value={participants}
              onChange={setParticipants}
              min={experience.min_participants || 1}
              max={experience.max_participants}
              labelClassName={formEyebrow}
            />
          )}
          <p className="text-sm font-medium text-foreground tabular-nums pt-0.5">
            Total {formatPrice(priceCalc.totalPrice, experience.currency)}
          </p>
        </section>

        {/* Guest details */}
        <section className="space-y-2">
          <p className={formEyebrow}>Guest details</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Guest name"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              className={formInput}
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Guest email"
              value={guestEmail}
              onChange={e => setGuestEmail(e.target.value)}
              className={formInput}
              autoComplete="email"
            />
            <input
              type="tel"
              placeholder="Guest phone (optional)"
              value={guestPhone}
              onChange={e => setGuestPhone(e.target.value)}
              className={formInput}
              autoComplete="tel"
            />
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-xl border border-destructive/25 bg-destructive/10 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || bookingState === 'submitting'}
          className="w-full h-12 text-sm font-medium rounded-xl bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {bookingState === 'submitting'
            ? 'Sending...'
            : isRental || useRequest
              ? 'Send Request'
              : `Book · ${formatPrice(priceCalc.totalPrice, experience.currency)}`}
        </button>
        </div>
      </div>
    </div>
  )
}
