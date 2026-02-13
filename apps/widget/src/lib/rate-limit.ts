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

// Helper to extract client IP from request
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  )
}
