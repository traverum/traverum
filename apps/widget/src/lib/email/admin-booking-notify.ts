import { sendEmail, formatEmailPrice } from './index'
import { baseTemplate } from './templates'
import { escapeHtml } from '@/lib/sanitize'

const NOTIFY_EMAIL = () => process.env.VEYOND_BOOKING_NOTIFY_EMAIL || 'info@traverum.com'

// ── Reservation notification (guest just clicked "Book now" or "Request a time") ──

interface AdminReservationData {
  experienceTitle: string
  supplierName: string
  guestName: string
  guestEmail: string
  channel: string          // "Veyond" or the hotel display name
  isDirect: boolean
  isRequest: boolean
  date: string
  time: string | null
  participants: number
  totalCents: number
  currency: string
}

export async function notifyAdminNewReservation(data: AdminReservationData): Promise<void> {
  try {
    const label = data.isRequest ? 'New Request' : 'New Reservation'
    const channelLabel = data.isDirect ? 'Veyond (direct)' : escapeHtml(data.channel)
    const price = formatEmailPrice(data.totalCents, data.currency)

    const html = baseTemplate(`
      <div class="card">
        <div class="header"><h1>${label}</h1></div>
        <p>A guest just ${data.isRequest ? 'requested a time' : 'selected a session'} via <strong>${channelLabel}</strong>.</p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Experience</span>
            <span class="info-value">${escapeHtml(data.experienceTitle)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Supplier</span>
            <span class="info-value">${escapeHtml(data.supplierName)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Guest</span>
            <span class="info-value">${escapeHtml(data.guestName)} (${escapeHtml(data.guestEmail)})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${data.date || 'TBD'}${data.time ? ` at ${data.time}` : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Participants</span>
            <span class="info-value">${data.participants}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total</span>
            <span class="info-value">${price}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Channel</span>
            <span class="info-value">${channelLabel}</span>
          </div>
        </div>
        <p class="text-muted">${data.isRequest ? 'Waiting for supplier approval.' : 'Guest is proceeding to payment.'}</p>
      </div>
    `, label)

    await sendEmail({
      to: NOTIFY_EMAIL(),
      subject: `${label} — ${data.experienceTitle}`,
      html,
    })
  } catch (error) {
    console.error('Admin reservation notification failed:', error)
  }
}

// ── Booking confirmed notification (payment succeeded or guarantee confirmed) ──

interface AdminBookingConfirmedData {
  experienceTitle: string
  supplierName: string
  guestName: string
  guestEmail: string
  channel: string
  isDirect: boolean
  date: string
  time: string | null
  participants: number
  totalCents: number
  platformCommissionCents: number
  hotelCommissionCents: number
  currency: string
  bookingId: string
  paymentMode: 'stripe' | 'pay_on_site' | 'manual'
}

export async function notifyAdminBookingConfirmed(data: AdminBookingConfirmedData): Promise<void> {
  try {
    const channelLabel = data.isDirect ? 'Veyond (direct)' : escapeHtml(data.channel)
    const price = formatEmailPrice(data.totalCents, data.currency)
    const commission = formatEmailPrice(data.platformCommissionCents, data.currency)
    const paymentLabel = data.paymentMode === 'pay_on_site' ? 'Pay on site' : data.paymentMode === 'manual' ? 'Manual' : 'Stripe'

    const html = baseTemplate(`
      <div class="card">
        <div class="header"><h1>Booking Confirmed</h1></div>
        <p>A booking was confirmed via <strong>${channelLabel}</strong>.</p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Experience</span>
            <span class="info-value">${escapeHtml(data.experienceTitle)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Supplier</span>
            <span class="info-value">${escapeHtml(data.supplierName)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Guest</span>
            <span class="info-value">${escapeHtml(data.guestName)} (${escapeHtml(data.guestEmail)})</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${data.date || 'TBD'}${data.time ? ` at ${data.time}` : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Participants</span>
            <span class="info-value">${data.participants}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total</span>
            <span class="info-value">${price}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Platform commission</span>
            <span class="info-value">${commission}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment</span>
            <span class="info-value">${paymentLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Channel</span>
            <span class="info-value">${channelLabel}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Booking ID</span>
            <span class="info-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    `, 'Booking Confirmed')

    await sendEmail({
      to: NOTIFY_EMAIL(),
      subject: `Booking confirmed — ${data.experienceTitle}`,
      html,
    })
  } catch (error) {
    console.error('Admin booking notification failed:', error)
  }
}
