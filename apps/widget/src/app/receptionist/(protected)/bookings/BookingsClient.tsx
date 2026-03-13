'use client'

import { useState } from 'react'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'

interface Booking {
  id: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  participants: number
  totalCents: number
  currency: string
  experienceTitle: string
  date: string | null
  time: string | null
  status: string
  isRequest: boolean
  paymentUrl: string | null
  createdAt: string
}

interface BookingsClientProps {
  bookings: Booking[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700 border border-green-200' },
  awaiting_payment: { label: 'Awaiting payment', className: 'bg-yellow-100 text-yellow-800' },
  request_pending: { label: 'Request pending', className: 'bg-blue-100 text-blue-800' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600' },
}

type FilterKey = 'all' | 'active' | 'completed' | 'expired'

export function BookingsClient({ bookings }: BookingsClientProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = bookings.filter(b => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!b.guestName.toLowerCase().includes(q) && !b.experienceTitle.toLowerCase().includes(q)) {
        return false
      }
    }
    switch (filter) {
      case 'active':
        return ['confirmed', 'awaiting_payment', 'request_pending'].includes(b.status)
      case 'completed':
        return b.status === 'completed'
      case 'expired':
        return ['expired', 'declined', 'cancelled'].includes(b.status)
      default:
        return true
    }
  })

  const handleCopy = async (bookingId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(bookingId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* clipboard may not be available */ }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bookings you created for guests
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([
            ['all', 'All'],
            ['active', 'Active'],
            ['completed', 'Completed'],
            ['expired', 'Past'],
          ] as [FilterKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search by guest or experience..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {bookings.length === 0
            ? 'No bookings yet. Create your first booking from the Book page.'
            : 'No bookings match your filter.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {filtered.map(b => {
            const statusConfig = STATUS_CONFIG[b.status] || STATUS_CONFIG.expired
            const isExpanded = expandedId === b.id

            return (
              <div key={b.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {b.guestName}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {b.experienceTitle}
                      {b.date && ` · ${formatDate(b.date, { short: true })}`}
                      {b.time && ` ${formatTime(b.time)}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(b.totalCents, b.currency)}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {b.participants} {b.participants === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Email:</span>{' '}
                        <a href={`mailto:${b.guestEmail}`} className="text-blue-600 hover:underline">
                          {b.guestEmail}
                        </a>
                      </div>
                      {b.guestPhone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>{' '}
                          <a href={`tel:${b.guestPhone}`} className="text-blue-600 hover:underline">
                            {b.guestPhone}
                          </a>
                        </div>
                      )}
                      {b.date && (
                        <div>
                          <span className="text-gray-500">Date:</span>{' '}
                          <span className="text-gray-900">{formatDate(b.date)}</span>
                          {b.time && ` at ${formatTime(b.time)}`}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Booked:</span>{' '}
                        <span className="text-gray-900">{formatDate(b.createdAt)}</span>
                      </div>
                    </div>

                    {b.paymentUrl && b.status === 'awaiting_payment' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(b.id, b.paymentUrl!) }}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {copiedId === b.id ? 'Copied!' : 'Copy Payment Link'}
                        </button>
                        <a
                          href={b.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Open Payment Page
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
