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

  // Success states
  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Accepted</h1>
          <p className="text-gray-500 text-sm">The guest has been sent a payment link. You can close this page.</p>
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Declined</h1>
          <p className="text-gray-500 text-sm">
            {suggestion.trim()
              ? 'The guest has been notified with your suggested times.'
              : 'The guest has been notified and encouraged to browse available sessions.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Booking Request</p>
          <h1 className="text-lg font-semibold leading-snug">{data.experienceTitle}</h1>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Guest</span>
            <span className="font-medium text-gray-900">{data.guestName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">{data.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-900">{data.time}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Participants</span>
            <span className="font-medium text-gray-900">{data.participants}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900 text-base">{data.totalFormatted}</span>
          </div>

          {/* Deadline */}
          <p className="text-xs text-gray-400 pt-1">
            Respond within {deadlineText}
          </p>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="mx-6 mb-4 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          {/* Accept button */}
          <button
            onClick={handleAccept}
            disabled={status === 'accepting' || status === 'declining'}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {status === 'accepting' ? 'Accepting...' : 'Accept Request'}
          </button>

          {/* Decline and optionally propose: form shown by default so supplier always has chance to add message */}
          {!showDeclineForm ? (
            <button
              onClick={() => setShowDeclineForm(true)}
              disabled={status === 'accepting' || status === 'declining'}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
            >
              Decline or propose other times
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Decline this time — add a message or suggest alternatives (optional)</p>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="e.g. I can do 14:00 or 16:00 on the same day, or any time on Friday."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300"
              />
              <p className="text-xs text-gray-400">
                {suggestion.trim()
                  ? 'Your message will be sent to the guest.'
                  : 'If you leave this empty, the guest will be encouraged to browse available sessions.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  disabled={status === 'accepting' || status === 'declining'}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'declining' ? 'Declining...' : 'Decline & send'}
                </button>
                <button
                  onClick={() => setShowDeclineForm(false)}
                  disabled={status === 'accepting' || status === 'declining'}
                  className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
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
