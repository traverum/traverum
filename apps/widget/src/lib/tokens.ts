import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret'

interface TokenPayload {
  id: string
  action: string
  exp: number
}

/**
 * Sign a token for email action links
 */
export function signToken(payload: TokenPayload): string {
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', SECRET)
    .update(data)
    .digest('hex')
  
  const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url')
  return token
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    const { data, signature } = decoded
    
    // Verify signature
    const expectedSignature = createHmac('sha256', SECRET)
      .update(data)
      .digest('hex')
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }
    
    // Parse and check expiration
    const payload: TokenPayload = JSON.parse(data)
    
    if (payload.exp < Date.now()) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

/**
 * Generate an accept token for a reservation
 */
export function generateAcceptToken(reservationId: string, expiresInHours: number = 48): string {
  return signToken({
    id: reservationId,
    action: 'accept',
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  })
}

/**
 * Generate a decline token for a reservation
 */
export function generateDeclineToken(reservationId: string, expiresInHours: number = 48): string {
  return signToken({
    id: reservationId,
    action: 'decline',
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  })
}

/**
 * Generate a cancel token for a booking.
 * Token is valid until 7 days after the experience so the email link always works;
 * the cancel route enforces the actual policy (e.g. "only cancel up to 7 days before").
 */
export function generateCancelToken(bookingId: string, experienceDate: Date): string {
  const expiry = new Date(experienceDate)
  expiry.setDate(expiry.getDate() + 7)
  return signToken({
    id: bookingId,
    action: 'cancel',
    exp: expiry.getTime(),
  })
}

/**
 * Generate a complete token for a booking
 */
export function generateCompleteToken(bookingId: string, expiresInDays: number = 14): string {
  return signToken({
    id: bookingId,
    action: 'complete',
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  })
}

/**
 * Generate a no-experience token for a booking
 */
export function generateNoExperienceToken(bookingId: string, expiresInDays: number = 14): string {
  return signToken({
    id: bookingId,
    action: 'no-experience',
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  })
}
