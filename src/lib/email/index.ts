import { Resend } from 'resend'

// Use a placeholder key for build time if not set
const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_key'
export const resend = new Resend(resendApiKey)

const FROM_EMAIL = process.env.FROM_EMAIL || 'Traverum <bookings@traverum.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://widget.traverum.com'

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

// Email template utilities
export function getAppUrl() {
  return APP_URL
}

export function formatEmailDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatEmailTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

export function formatEmailPrice(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}
