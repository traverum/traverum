import { Resend } from 'resend'

// Use a placeholder for build time when env is not set (invalid; runtime sends will fail until RESEND_API_KEY is set)
const resendApiKey = process.env.RESEND_API_KEY || ''
export const resend = new Resend(resendApiKey)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Veyond <bookings@veyond.eu>'
const PRODUCTION_URL = 'https://book.veyond.eu'
const PRODUCTION_VEYOND_URL = 'https://veyond.app'
// Never use localhost in production — always fall back to production URL
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || PRODUCTION_URL
const APP_URL = rawAppUrl.includes('localhost') && process.env.VERCEL ? PRODUCTION_URL : rawAppUrl

const rawVeyondUrl = process.env.NEXT_PUBLIC_VEYOND_URL || PRODUCTION_VEYOND_URL
const VEYOND_URL = rawVeyondUrl.includes('localhost') && process.env.VERCEL ? PRODUCTION_VEYOND_URL : rawVeyondUrl

export interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    })
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

/**
 * Send multiple emails in a single API call to avoid rate limits.
 * Resend batch API supports up to 100 emails per request.
 */
export async function sendBatchEmails(emails: EmailOptions[]): Promise<{ success: boolean; error?: unknown }> {
  if (emails.length === 0) return { success: true }
  if (emails.length === 1) return sendEmail(emails[0])

  try {
    await resend.batch.send(
      emails.map(e => ({
        from: FROM_EMAIL,
        to: e.to,
        subject: e.subject,
        html: e.html,
        reply_to: e.replyTo,
      }))
    )
    return { success: true }
  } catch (error) {
    console.error('Failed to send batch emails:', error)
    return { success: false, error }
  }
}

// Email template utilities
export function getAppUrl() {
  return APP_URL
}

/**
 * Absolute URL for the Veyond direct channel (veyond.app).
 * path should start with "/" — e.g. directChannelUrl('/confirmation/abc')
 */
export function getVeyondUrl(path: string = '/') {
  return `${VEYOND_URL}${path}`
}

export function formatEmailDate(date: string): string {
  if (!date) return 'Flexible date'
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return 'Flexible date'
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatEmailTime(time: string | null | undefined): string {
  if (!time) return 'Flexible'
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

export function formatEmailPrice(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}
