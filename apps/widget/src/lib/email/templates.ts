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
        <h1>Complete Your Booking! 🎉</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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

// Guest: Payment failed
export function guestPaymentFailed(data: BaseEmailData & {
  paymentUrl: string
  errorMessage?: string
}) {
  const content = `
    <div class="card">
      <div class="header">
        <h1>Payment Failed ❌</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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
        <h1>Refund Processed 💳</h1>
      </div>
      <p>Hi ${data.guestName},</p>
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
        <h1>Payment Sent! 🎉</h1>
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
          <span class="info-value">${data.guestName}</span>
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

// Guest: Time proposed by supplier (1-3 alternative slots)
export function guestTimeProposed(data: {
  experienceTitle: string
  guestName: string
  originalDate: string
  originalTime: string
  proposedTimes: Array<{ date: string; time: string }>
  participants: number
  totalCents: number
  currency?: string
  acceptUrl: string
  declineUrl: string
}) {
  const slotsHtml = data.proposedTimes.map((slot, index) => `
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px 16px; margin: 8px 0; text-align: center;">
      <strong>Option ${index + 1}:</strong> ${formatEmailDate(slot.date)} at ${formatEmailTime(slot.time)}
      <br/>
      <a href="${data.acceptUrl}&slot=${index}" class="btn btn-success" style="margin-top: 8px; padding: 10px 20px; font-size: 14px;">Accept this time</a>
    </div>
  `).join('')

  const content = `
    <div class="card">
      <div class="header">
        <h1>New Time Proposed</h1>
      </div>
      <p>Hi ${data.guestName},</p>
      <p>The experience provider reviewed your request for <strong>${data.experienceTitle}</strong> on ${formatEmailDate(data.originalDate)} at ${formatEmailTime(data.originalTime)}, but that time isn't available.</p>
      <p>They've proposed the following alternative${data.proposedTimes.length > 1 ? 's' : ''}:</p>
      
      ${slotsHtml}
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Participants</span>
          <span class="info-value">${data.participants}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Total</span>
          <span class="info-value">${formatEmailPrice(data.totalCents, data.currency)}</span>
        </div>
      </div>
      
      <div class="text-center mt-4">
        <a href="${data.declineUrl}" class="btn btn-secondary">None of these work</a>
      </div>
      
      <p class="text-muted text-center mt-4">Please respond within 48 hours. If you don't respond, the request will expire automatically.</p>
    </div>
  `
  return baseTemplate(content, 'New Time Proposed')
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
  const statusIcon = data.isOnboardingComplete ? '✅' : '⚠️'
  const content = `
    <div class="card">
      <div class="header">
        <h1>Stripe Account Update ${statusIcon}</h1>
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
          <span class="info-value">${data.isOnboardingComplete ? 'Yes ✅' : 'No ❌'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Charges Enabled</span>
          <span class="info-value">${data.chargesEnabled ? 'Yes ✅' : 'No ❌'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payouts Enabled</span>
          <span class="info-value">${data.payoutsEnabled ? 'Yes ✅' : 'No ❌'}</span>
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