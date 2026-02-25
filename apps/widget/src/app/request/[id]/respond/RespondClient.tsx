'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface RequestData {
  id: string
  experienceTitle: string
  guestName: string
  date: string
  time: string
  rawTime: string
  participants: number
  totalFormatted: string
  responseDeadline: string
}

interface RespondClientProps {
  data: RequestData
  reservationId: string
  acceptToken: string
  declineToken: string
}

type Status = 'idle' | 'accepting' | 'declining' | 'accepted' | 'declined' | 'error'

export function RespondClient({ data, reservationId, acceptToken, declineToken }: RespondClientProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // Default to showing decline/propose form so supplier always sees option to add message (proposing optional)
  const [showDeclineForm, setShowDeclineForm] = useState(true)
  const [suggestion, setSuggestion] = useState('')

  const deadlineDate = new Date(data.responseDeadline)
  const deadlineText = formatDistanceToNow(deadlineDate, { addSuffix: false })

  const handleAccept = async () => {
    setStatus('accepting')
    setErrorMessage('')

    try {
      const response = await fetch(`/api/reservations/${reservationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: acceptToken }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept')
      }

      setStatus('accepted')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  const handleDecline = async () => {
    setStatus('declining')
    setErrorMessage('')

    try {
      const response = await fetch(`/api/reservations/${reservationId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: declineToken,
          message: suggestion.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to decline')
      }

      setStatus('declined')
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  // Traverum palette (brand-essence)
  const styles = {
    bg: '#F4EFE6',
    card: '#FEFCF9',
    border: 'rgba(55, 53, 47, 0.09)',
    olive: '#5A6B4E',
    walnut: '#5D4631',
    text: 'rgb(55, 53, 47)',
    muted: 'rgba(55, 53, 47, 0.5)',
    success: '#6B8E6B',
    successBg: 'rgba(107, 142, 107, 0.12)',
    error: '#B8866B',
    errorBg: 'rgba(184, 134, 107, 0.12)',
    inputBg: 'rgba(244, 239, 230, 0.6)',
  }

  // Success states
  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: styles.bg }}>
        <div className="rounded-md p-8 max-w-sm w-full text-center border" style={{ backgroundColor: styles.card, borderColor: styles.border }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: styles.successBg }}>
            <svg className="w-8 h-8" style={{ color: styles.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-medium mb-2" style={{ color: styles.walnut }}>Accepted</h1>
          <p className="text-sm font-light" style={{ color: styles.muted }}>The guest has been sent a payment link. You can close this page.</p>
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: styles.bg }}>
        <div className="rounded-md p-8 max-w-sm w-full text-center border" style={{ backgroundColor: styles.card, borderColor: styles.border }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(55, 53, 47, 0.08)' }}>
            <svg className="w-8 h-8 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-medium mb-2" style={{ color: styles.walnut }}>Declined</h1>
          <p className="text-sm font-light" style={{ color: styles.muted }}>
            {suggestion.trim()
              ? 'The guest has been notified with your suggested times.'
              : 'The guest has been notified and encouraged to browse available sessions.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: styles.bg }}>
      <div className="rounded-md max-w-sm w-full overflow-hidden border" style={{ backgroundColor: styles.card, borderColor: styles.border }}>
        {/* Header — olive */}
        <div className="px-6 py-5 text-white" style={{ backgroundColor: styles.olive }}>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Booking Request</p>
          <h1 className="text-lg font-medium leading-snug" style={{ color: '#FEFCF9' }}>{data.experienceTitle}</h1>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.muted }}>Guest</span>
            <span className="font-medium" style={{ color: styles.text }}>{data.guestName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.muted }}>Date</span>
            <span className="font-medium" style={{ color: styles.text }}>{data.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.muted }}>Time</span>
            <span className="font-medium" style={{ color: styles.text }}>{data.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.muted }}>Participants</span>
            <span className="font-medium" style={{ color: styles.text }}>{data.participants}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-3" style={{ borderColor: styles.border }}>
            <span style={{ color: styles.muted }}>Total</span>
            <span className="font-medium text-base" style={{ color: styles.text }}>{data.totalFormatted}</span>
          </div>

          <p className="text-xs pt-1 font-light" style={{ color: styles.muted }}>
            Respond within {deadlineText}
          </p>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="mx-6 mb-4 px-4 py-3 text-sm rounded-md border" style={{ backgroundColor: styles.errorBg, color: styles.error, borderColor: 'rgba(184, 134, 107, 0.3)' }}>
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleAccept}
            disabled={status === 'accepting' || status === 'declining'}
            className="w-full py-3.5 text-white font-medium rounded-md text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0"
            style={{ backgroundColor: styles.success }}
          >
            {status === 'accepting' ? 'Accepting...' : 'Accept Request'}
          </button>

          {!showDeclineForm ? (
            <button
              onClick={() => setShowDeclineForm(true)}
              disabled={status === 'accepting' || status === 'declining'}
              className="w-full py-3 font-medium text-sm transition-colors disabled:opacity-50"
              style={{ color: styles.muted }}
            >
              Decline or propose other times
            </button>
          ) : (
            <div className="rounded-md p-4 space-y-3 border" style={{ backgroundColor: styles.inputBg, borderColor: styles.border }}>
              <p className="text-sm font-medium" style={{ color: styles.text }}>Decline this time — add a message or suggest alternatives (optional)</p>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="e.g. I can do 14:00 or 16:00 on the same day, or any time on Friday."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-md border-0 resize-none focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:opacity-60"
                style={{ backgroundColor: styles.card, color: styles.text, borderColor: styles.border }}
              />
              <p className="text-xs font-light" style={{ color: styles.muted }}>
                {suggestion.trim()
                  ? 'Your message will be sent to the guest.'
                  : 'If you leave this empty, the guest will be encouraged to browse available sessions.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  disabled={status === 'accepting' || status === 'declining'}
                  className="flex-1 py-2.5 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-0"
                  style={{ backgroundColor: styles.error }}
                >
                  {status === 'declining' ? 'Declining...' : 'Decline & send'}
                </button>
                <button
                  onClick={() => setShowDeclineForm(false)}
                  disabled={status === 'accepting' || status === 'declining'}
                  className="py-2.5 px-4 font-medium rounded-md text-sm transition-colors disabled:opacity-50 border"
                  style={{ backgroundColor: 'rgba(55, 53, 47, 0.08)', color: styles.text, borderColor: styles.border }}
                >
                  Collapse
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
