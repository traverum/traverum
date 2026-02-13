import { getAppUrl, formatEmailDate, formatEmailTime, formatEmailPrice } from './index'
import { escapeHtml } from '@/lib/sanitize'

interface BaseEmailData {
  experienceTitle: string
  guestName: string
  date: string
  time: string | null | undefined
  participants: number
  totalCents: number
  currency?: string
}

// Base template wrapper - follows dashboard design principles (warm white, muted palette, no emojis)
function baseTemplate(content: string, title: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: rgba(55, 53, 47, 0.9); margin: 0; padding: 0; background-color: #FEFCF9; }
    .container { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #FEFCF9; border-radius: 4px; padding: 32px; margin: 24px 0; border: 1px solid rgba(55, 53, 47, 0.09); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; color: rgba(55, 53, 47, 0.95); }
    .info-box { background: rgba(242, 241, 238, 0.6); border-radius: 4px; padding: 16px; margin: 20px 0; border: 1px solid rgba(55, 53, 47, 0.06); }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(55, 53, 47, 0.06); }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: rgba(55, 53, 47, 0.5); font-size: 14px; }
    .info-value { font-weight: 600; color: rgba(55, 53, 47, 0.9); font-size: 14px; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 3px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 8px 4px; }
    .btn-primary { background: #0D9488; color: white; }
    .btn-success { background: #6B8E6B; color: white; }
    .btn-danger { background: #B8866B; color: white; }
    .btn-secondary { background: rgba(55, 53, 47, 0.4); color: white; }
    .footer { text-align: center; color: rgba(55, 53, 47, 0.4); font-size: 12px; margin-top: 32px; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .text-muted { color: rgba(55, 53, 47, 0.5); font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Powered by Traverum</p>
    </div>
  </div>
</body>
</html>
`
}

// Guest: Booking approved
export function guestBookingApproved(data: BaseEmailData & { 
  paymentUrl: string
  meetingPoint?: string | null
  paymentDeadline: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Booking Approved</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Great news! Your booking request has been approved. Please complete your payment to confirm the booking.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        ${data.meetingPoint ? `
        <div class="info-row">
          <span class="info-label">Meeting Point</span>
          <span class="info-value">${data.meetingPoint}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Total to Pay</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <a href="${data.paymentUrl}" class="btn btn-primary">Complete Payment</a>
      </div>
      
      <p class="text-muted text-center mt-4">Payment must be completed by ${formatEmailDate(data.paymentDeadline)} to secure your booking.</p>
    </div>
  `
  return baseTemplate(content, 'Booking Approved')
}

// Guest: Request declined
export function guestRequestDeclined(data: BaseEmailData & { 
  experienceUrl?: string
  supplierMessage?: string 
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Booking Unavailable</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Unfortunately, the experience provider was unable to accept your booking request for the requested time.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
      </div>
      
      ${data.supplierMessage ? `
      <div style="background: rgba(201, 169, 97, 0.12); border-radius: 4px; padding: 16px; margin: 20px 0; border: 1px solid rgba(201, 169, 97, 0.3);">
        <p style="margin: 0 0 4px; font-weight: 600; color: #8B7355; font-size: 14px;">Message from the provider:</p>
        <p style="margin: 0; color: rgba(55, 53, 47, 0.8); font-size: 14px;">${data.supplierMessage}</p>
      </div>
      ` : ''}
      
      <p>There may be other available sessions for this experience.</p>
      
      <div class="text-center mt-4">
        <a href="${data.experienceUrl || '#'}" class="btn btn-primary">View Available Sessions</a>
      </div>
      
      <p class="text-muted text-center mt-4">Browse the latest availability and book a time that works for you.</p>
    </div>
  `
  return baseTemplate(content, 'Booking Unavailable')
}

// Guest: Payment confirmed
export function guestPaymentConfirmed(data: BaseEmailData & {
  bookingId: string
  meetingPoint?: string | null
  cancelUrl: string
  supplierName: string
  /** Cancellation policy text from experience (e.g. "Free cancellation up to 7 days before."). If allowCancel is false, use policy text like "This booking is non-refundable." */
  cancellationPolicyText: string
  /** Whether guest can cancel for refund (flexible/moderate = true; strict/non_refundable = false) */
  allowCancel: boolean
}) {
  const cancelSection = data.allowCancel
    ? `
      <p class="text-muted">Need to cancel? ${data.cancellationPolicyText}</p>
      <div class="text-center mt-4">
        <a href="${data.cancelUrl}" class="btn btn-secondary">Cancel Booking</a>
      </div>
    `
    : `<p class="text-muted">${data.cancellationPolicyText}</p>`

  const content = `
    <div class="card">
      <div class="header">
        <h1>Booking Confirmed</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Your payment has been received and your booking is now confirmed!</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Booking Reference</span>
          <span class="info-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Provider</span>
          <span class="info-value">${data.supplierName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        ${data.meetingPoint ? `
        <div class="info-row">
          <span class="info-label">Meeting Point</span>
          <span class="info-value">${data.meetingPoint}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Amount Paid</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      ${cancelSection}
    </div>
  `
  return baseTemplate(content, 'Booking Confirmed')
}

// Guest: Spot reserved (session below minimum to run, no payment yet)
export function guestSpotReserved(data: BaseEmailData & {
  minParticipants: number
  bookedSoFar: number
  reservationPageUrl: string
}) {
  const remaining = data.minParticipants - data.bookedSoFar
  const content = `
    <div class="card">
      <div class="header">
        <h1>Spot Reserved</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Your spot has been reserved! This experience needs at least ${data.minParticipants} participants to run. Currently ${data.bookedSoFar} of ${data.minParticipants} spots are booked${remaining > 0 ? ` &mdash; ${remaining} more needed` : ''}.</p>
      <p>Once the minimum is reached, you'll receive a payment link to confirm your booking. No payment is required until then.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Your Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expected Total</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Progress</span>
          <span class="info-value">${data.bookedSoFar} / ${data.minParticipants} minimum</span>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <a href="${data.reservationPageUrl}" class="btn btn-primary">View Reservation</a>
      </div>
      
      <p class="text-muted text-center mt-4">If the minimum isn't reached before the session, your reservation will be cancelled automatically and no payment will be taken.</p>
    </div>
  `
  return baseTemplate(content, 'Spot Reserved')
}

// Supplier: New reservation toward minimum
export function supplierNewReservation(data: BaseEmailData & {
  guestEmail: string
  guestPhone?: string | null
  minParticipants: number
  bookedSoFar: number
  hotelName: string
  dashboardUrl?: string
}) {
  const remaining = data.minParticipants - data.bookedSoFar
  const content = `
    <div class="card">
      <div class="header">
        <h1>New Reservation</h1>
      </div>
      <p>A guest has reserved a spot for your experience via ${data.hotelName}.</p>
      <p>Session progress: <strong>${data.bookedSoFar} / ${data.minParticipants} minimum</strong>${remaining > 0 ? ` &mdash; ${remaining} more needed to confirm.` : ' &mdash; minimum reached!'}</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Name</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${escapeHtml(data.guestEmail)}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${escapeHtml(data.guestPhone || '')}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
      </div>
      
      ${data.dashboardUrl ? `
      <div class="text-center mt-4">
        <a href="${data.dashboardUrl}" class="btn btn-primary">View on Dashboard</a>
      </div>
      ` : ''}
      
      <p class="text-muted text-center mt-4">Once the minimum is reached, all guests will be sent payment links automatically. You can also confirm the session early from your dashboard.</p>
    </div>
  `
  return baseTemplate(content, 'New Reservation')
}

// Guest: Minimum not reached — reservation cancelled (no payment was taken)
export function guestMinimumNotReached(data: BaseEmailData & {
  minParticipants: number
  bookedSoFar: number
  experienceUrl?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Reservation Cancelled</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Unfortunately, the session for ${data.experienceTitle} on ${formatEmailDate(data.date)} did not reach the minimum of ${data.minParticipants} participants (${data.bookedSoFar} were booked). Your reservation has been cancelled.</p>
      <p><strong>No payment was taken.</strong></p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
      </div>
      
      ${data.experienceUrl ? `
      <p>There may be other sessions available:</p>
      <div class="text-center mt-4">
        <a href="${data.experienceUrl}" class="btn btn-primary">View Other Sessions</a>
      </div>
      ` : ''}
    </div>
  `
  return baseTemplate(content, 'Reservation Cancelled')
}

// Supplier: Session cancelled — minimum not reached
export function supplierMinimumNotReached(data: {
  experienceTitle: string
  date: string
  time: string | null | undefined
  minParticipants: number
  bookedSoFar: number
  dashboardUrl?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Session Cancelled</h1>
      </div>
      <p>The session for ${data.experienceTitle} on ${formatEmailDate(data.date)} did not reach the minimum of ${data.minParticipants} participants (${data.bookedSoFar} were booked). All guest reservations have been cancelled.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Progress</span>
          <span class="info-value">${data.bookedSoFar} / ${data.minParticipants} minimum</span>
        </div>
      </div>
      
      ${data.dashboardUrl ? `
      <div class="text-center mt-4">
        <a href="${data.dashboardUrl}" class="btn btn-primary">Go to Dashboard</a>
      </div>
      ` : ''}
      
      <p class="text-muted text-center mt-4">No payments were collected, so no refunds are needed.</p>
    </div>
  `
  return baseTemplate(content, 'Session Cancelled — Minimum Not Reached')
}

// Guest: Instant booking (session-based, can pay immediately)
export function guestInstantBooking(data: BaseEmailData & { 
  paymentUrl: string
  meetingPoint?: string | null
  paymentDeadline: string
  hotelName: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Complete Your Booking</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Great choice! Your spot is reserved. Complete your payment to confirm the booking.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        ${data.meetingPoint ? `
        <div class="info-row">
          <span class="info-label">Meeting Point</span>
          <span class="info-value">${data.meetingPoint}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total to Pay</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <a href="${data.paymentUrl}" class="btn btn-primary">Pay Now</a>
      </div>
      
      <p class="text-muted text-center mt-4">Complete payment by ${formatEmailDate(data.paymentDeadline)} to secure your spot.</p>
    </div>
  `
  return baseTemplate(content, 'Complete Your Booking')
}

// Supplier: New booking notification (session-based, no accept/decline)
export function supplierNewBooking(data: BaseEmailData & {
  guestEmail: string
  guestPhone?: string | null
  hotelName: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>New Booking Pending Payment</h1>
      </div>
      <p>A guest has booked your experience via ${data.hotelName}. Payment is pending.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Name</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${escapeHtml(data.guestEmail)}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${escapeHtml(data.guestPhone || '')}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Price</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <p class="text-muted text-center mt-4">You'll receive a confirmation email once the guest completes payment.</p>
    </div>
  `
  return baseTemplate(content, 'New Booking Pending Payment')
}

// Supplier: New request (request-based, needs accept/decline)
export function supplierNewRequest(data: BaseEmailData & {
  guestEmail: string
  guestPhone?: string | null
  acceptUrl: string
  declineUrl: string
  manageUrl?: string
  hotelName: string
  dashboardUrl?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>New Booking Request</h1>
      </div>
      <p>You have a new booking request via ${data.hotelName}!</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Name</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${escapeHtml(data.guestEmail)}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${escapeHtml(data.guestPhone || '')}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Requested Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Requested Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Price</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <a href="${data.acceptUrl}" class="btn btn-success">Accept</a>
        <a href="${data.declineUrl}" class="btn btn-danger">Decline</a>
      </div>
      
      ${data.manageUrl ? `
      <div class="text-center mt-4">
        <a href="${data.manageUrl}" style="color: rgba(55, 53, 47, 0.5); font-size: 14px; text-decoration: underline;">Decline &amp; suggest other times</a>
      </div>
      ` : ''}
      
      <p class="text-muted text-center mt-4">Please respond within 48 hours. If you don't respond, the request will expire automatically.</p>
    </div>
  `
  return baseTemplate(content, 'New Booking Request')
}

// Supplier: Booking confirmed (guest paid)
export function supplierBookingConfirmed(data: BaseEmailData & {
  guestEmail: string
  guestPhone?: string | null
  bookingId: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Payment Received</h1>
      </div>
      <p>Great news! Your guest has completed payment and the booking is now confirmed.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Booking Reference</span>
          <span class="info-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Name</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${escapeHtml(data.guestEmail)}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${escapeHtml(data.guestPhone || '')}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
      </div>
      
      <p class="text-muted">After the experience, you'll receive an email to confirm completion and receive your payment.</p>
    </div>
  `
  return baseTemplate(content, 'Payment Received')
}

// Supplier: Completion check
export function supplierCompletionCheck(data: BaseEmailData & {
  bookingId: string
  completeUrl: string
  noExperienceUrl: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Did the experience happen?</h1>
      </div>
      <p>We hope your experience with ${escapeHtml(data.guestName)} went well!</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
      </div>
      
      <p>Please confirm whether this experience took place:</p>
      
      <div class="text-center mt-4">
        <a href="${data.completeUrl}" class="btn btn-success">Yes, it happened</a>
        <a href="${data.noExperienceUrl}" class="btn btn-danger">No, it didn't</a>
      </div>
      
      <p class="text-muted text-center mt-4">If you confirm, payment will be transferred to your account. If you click "No", the guest will receive a full refund.</p>
    </div>
  `
  return baseTemplate(content, 'Confirm Experience')
}

// Guest: Payment failed
export function guestPaymentFailed(data: BaseEmailData & {
  paymentUrl: string
  errorMessage?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Payment Failed</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Unfortunately, your payment for the following experience could not be processed.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Time</span>
          <span class="info-value">${formatEmailTime(data.time)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
        ${data.errorMessage ? `
        <div class="info-row">
          <span class="info-label">Reason</span>
          <span class="info-value">${data.errorMessage}</span>
        </div>
        ` : ''}
      </div>
      
      <p>Please try again with a different payment method or contact your bank if the issue persists.</p>
      
      <div class="text-center mt-4">
        <a href="${data.paymentUrl}" class="btn btn-primary">Try Again</a>
      </div>
      
      <p class="text-muted text-center mt-4">Your reservation is still held. Please complete payment soon to secure your booking.</p>
    </div>
  `
  return baseTemplate(content, 'Payment Failed')
}

// Guest: Refund processed
export function guestRefundProcessed(data: BaseEmailData & {
  bookingId: string
  refundAmount: number
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Refund Processed</h1>
      </div>
      <p>Hi ${escapeHtml(data.guestName)},</p>
      <p>Your refund has been processed successfully. The funds will be returned to your original payment method within 5-10 business days.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Booking Reference</span>
          <span class="info-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Original Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Refund Amount</span>
          <span class="info-value">${formatEmailPrice(data.refundAmount, data.currency)}</span>
        </div>
      </div>
      
      <p class="text-muted">We're sorry this experience didn't work out. We hope to see you again soon!</p>
    </div>
  `
  return baseTemplate(content, 'Refund Processed')
}

// Supplier: Payout notification
export function supplierPayoutSent(data: {
  experienceTitle: string
  bookingId: string
  guestName: string
  date: string
  payoutAmount: number
  currency?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Payment Sent</h1>
      </div>
      <p>Great news! Your payout has been initiated and is on its way to your bank account.</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Booking Reference</span>
          <span class="info-value">${data.bookingId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Experience</span>
          <span class="info-value">${data.experienceTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest</span>
          <span class="info-value">${escapeHtml(data.guestName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Experience Date</span>
          <span class="info-value">${formatEmailDate(data.date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payout Amount</span>
          <span class="info-value">${formatEmailPrice(data.payoutAmount, data.currency)}</span>
        </div>
      </div>
      
      <p class="text-muted">Payouts typically arrive within 2-3 business days depending on your bank.</p>
    </div>
  `
  return baseTemplate(content, 'Payment Sent')
}

// Admin: Stripe account updated
export function adminAccountStatusChanged(data: {
  partnerName: string
  partnerEmail: string
  partnerType: string
  stripeAccountId: string
  isOnboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Stripe Account Update</h1>
      </div>
      <p>A partner's Stripe account status has changed:</p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Partner</span>
          <span class="info-value">${data.partnerName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">${data.partnerEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type</span>
          <span class="info-value">${data.partnerType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Stripe Account</span>
          <span class="info-value">${data.stripeAccountId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Onboarding Complete</span>
          <span class="info-value">${data.isOnboardingComplete ? 'Yes' : 'No'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Charges Enabled</span>
          <span class="info-value">${data.chargesEnabled ? 'Yes' : 'No'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payouts Enabled</span>
          <span class="info-value">${data.payoutsEnabled ? 'Yes' : 'No'}</span>
        </div>
      </div>
      
      ${!data.isOnboardingComplete ? `
      <p class="text-muted">This partner needs to complete their Stripe onboarding before they can receive payouts.</p>
      ` : `
      <p class="text-muted">This partner is fully set up and ready to receive payouts!</p>
      `}
    </div>
  `
  return baseTemplate(content, 'Stripe Account Update')
}