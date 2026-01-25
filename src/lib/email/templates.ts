import { getAppUrl, formatEmailDate, formatEmailTime, formatEmailPrice } from './index'

interface BaseEmailData {
  experienceTitle: string
  guestName: string
  date: string
  time: string
  participants: number
  totalCents: number
  currency?: string
}

// Base template wrapper
function baseTemplate(content: string, title: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #111; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; }
    .info-value { font-weight: 600; color: #111; }
    .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 8px 4px; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-success { background: #16a34a; color: white; }
    .btn-secondary { background: #6b7280; color: white; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 24px; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .text-muted { color: #666; font-size: 14px; }
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

// Guest: Request received
export function guestRequestReceived(data: BaseEmailData & { hotelName: string }) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Request Received!</h1>
      </div>
      <p>Hi ${data.guestName},</p>
      <p>Thank you for your booking request through ${data.hotelName}. The experience provider will review your request and respond within 48 hours.</p>
      
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
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <p class="text-muted">We'll send you an email as soon as the provider responds to your request.</p>
    </div>
  `
  return baseTemplate(content, 'Request Received')
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
        <h1>Booking Approved! 🎉</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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
export function guestRequestDeclined(data: BaseEmailData) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Booking Unavailable</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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
      
      <p>Feel free to try booking a different date or time. We hope to see you soon!</p>
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
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Booking Confirmed! ✅</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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
      
      <p class="text-muted">Need to cancel? Free cancellation is available up to 7 days before the experience.</p>
      
      <div class="text-center mt-4">
        <a href="${data.cancelUrl}" class="btn btn-secondary">Cancel Booking</a>
      </div>
    </div>
  `
  return baseTemplate(content, 'Booking Confirmed')
}

// Supplier: New request
export function supplierNewRequest(data: BaseEmailData & {
  guestEmail: string
  guestPhone?: string | null
  acceptUrl: string
  declineUrl: string
  hotelName: string
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
          <span class="info-value">${data.guestName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${data.guestEmail}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${data.guestPhone}</span>
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
        <h1>Payment Received! 💰</h1>
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
          <span class="info-value">${data.guestName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Guest Email</span>
          <span class="info-value">${data.guestEmail}</span>
        </div>
        ${data.guestPhone ? `
        <div class="info-row">
          <span class="info-label">Guest Phone</span>
          <span class="info-value">${data.guestPhone}</span>
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
      <p>We hope your experience with ${data.guestName} went well!</p>
      
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
          <span class="info-value">${data.guestName}</span>
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
