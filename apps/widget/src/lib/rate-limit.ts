import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

// 10 requests per 60s per IP for reservation creation
export const reservationLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'ratelimit:reservations',
})

// 30 requests per 60s per IP for embed API
export const embedLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'ratelimit:embed',
})

// Signup (reCAPTCHA verify) — limit per IP to prevent mass account creation
export const signupLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:signup',
})

// Invite acceptance — limit per IP to prevent mass user creation via invite abuse / token enumeration
export const inviteAcceptLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  prefix: 'ratelimit:invite_accept',
})

// Translation API — public from widget; limit per IP to prevent burning translation quota
export const translateLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(60, '1 h'),
  prefix: 'ratelimit:translate',
})

// Analytics track — public; limit per IP to prevent DB spam and skewed metrics
export const analyticsLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: 'ratelimit:analytics',
})

// Helper to extract client IP from request
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  )
}
