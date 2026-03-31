'use client'

import { useState } from 'react'
import { formatPrice, formatDate, formatTime } from '@/lib/utils'
import { ChevronDown, Copy, ExternalLink } from 'lucide-react'

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
  bookedBy: string | null
}

interface BookingsClientProps {
  bookings: Booking[]
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-success/10 text-success' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  awaiting_payment: { label: 'Waiting for payment', className: 'bg-warning/10 text-warning' },
  request_pending: { label: 'Request pending', className: 'bg-info/10 text-foreground' },
  declined: { label: 'Declined', className: 'bg-destructive/10 text-destructive' },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
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
    <div className="space-y-5">
      <h1 className="text-2xl font-light text-foreground">Bookings</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex bg-muted rounded-2xl p-1">
          {([
            ['all', 'All'],
            ['active', 'Active'],
            ['completed', 'Completed'],
            ['expired', 'Past'],
          ] as [FilterKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                filter === key
                  ? 'bg-card text-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 sm:max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 px-4 text-sm rounded-xl border border-border/50 bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {bookings.length === 0 ? 'No bookings yet.' : 'No bookings match your filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const statusConfig = STATUS_CONFIG[b.status] || STATUS_CONFIG.expired
            const isExpanded = expandedId === b.id

            return (
              <div key={b.id} className="bg-card rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-foreground truncate">
                        {b.guestName}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {b.experienceTitle}
                      {b.date && ` · ${formatDate(b.date, { short: true })}`}
                      {b.time && ` ${formatTime(b.time)}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-foreground">
                      {formatPrice(b.totalCents, b.currency)}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {b.participants} {b.participants === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 border-t border-border/50">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm pt-2">
                      <a href={`mailto:${b.guestEmail}`} className="text-foreground underline hover:no-underline">
                        {b.guestEmail}
                      </a>
                      {b.guestPhone && (
                        <a href={`tel:${b.guestPhone}`} className="text-foreground underline hover:no-underline">
                          {b.guestPhone}
                        </a>
                      )}
                      <span className="text-muted-foreground">
                        Booked {formatDate(b.createdAt)}
                        {b.bookedBy && ` by ${b.bookedBy}`}
                      </span>
                    </div>

                    {b.paymentUrl && b.status === 'awaiting_payment' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(b.id, b.paymentUrl!) }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-muted text-foreground hover:bg-accent/10 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {copiedId === b.id ? 'Copied!' : 'Copy Link'}
                        </button>
                        <a
                          href={b.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-muted text-foreground hover:bg-accent/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
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
