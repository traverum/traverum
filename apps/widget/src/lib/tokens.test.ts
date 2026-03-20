import { describe, it, expect, vi } from 'vitest'
import {
  signToken,
  verifyToken,
  generateAcceptToken,
  generateDeclineToken,
  generateCancelToken,
  generateCompleteToken,
  generateNoExperienceToken,
} from './tokens'

describe('signToken / verifyToken round-trip', () => {
  it('produces a base64url string', () => {
    const token = signToken({ id: 'test-id', action: 'accept', exp: Date.now() + 60_000 })
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
    // base64url: no +, /, or = characters
    expect(token).not.toMatch(/[+/=]/)
  })

  it('round-trips correctly', () => {
    const payload = { id: 'res-123', action: 'accept', exp: Date.now() + 60_000 }
    const token = signToken(payload)
    const result = verifyToken(token)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('res-123')
    expect(result!.action).toBe('accept')
    expect(result!.exp).toBe(payload.exp)
  })
})

describe('verifyToken rejection', () => {
  it('rejects tampered tokens', () => {
    const token = signToken({ id: 'res-123', action: 'accept', exp: Date.now() + 60_000 })
    // Tamper by flipping a character in the middle
    const tampered = token.slice(0, 10) + 'X' + token.slice(11)
    expect(verifyToken(tampered)).toBeNull()
  })

  it('rejects expired tokens', () => {
    const expiredPayload = { id: 'res-123', action: 'accept', exp: Date.now() - 1000 }
    const token = signToken(expiredPayload)
    expect(verifyToken(token)).toBeNull()
  })

  it('returns null for garbage input', () => {
    expect(verifyToken('not-a-valid-token-at-all')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(verifyToken('')).toBeNull()
  })

  it('returns null for random base64', () => {
    const fake = Buffer.from('{"data":"fake","signature":"fake"}').toString('base64url')
    expect(verifyToken(fake)).toBeNull()
  })
})

describe('generateAcceptToken', () => {
  it('produces a verifiable token with action "accept"', () => {
    const token = generateAcceptToken('res-abc')
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.id).toBe('res-abc')
    expect(payload!.action).toBe('accept')
  })

  it('defaults to 48-hour expiry', () => {
    const before = Date.now()
    const token = generateAcceptToken('res-abc')
    const after = Date.now()
    const payload = verifyToken(token)!
    const expected48h = 48 * 60 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(before + expected48h)
    expect(payload.exp).toBeLessThanOrEqual(after + expected48h)
  })

  it('respects custom expiry', () => {
    const before = Date.now()
    const token = generateAcceptToken('res-abc', 24)
    const payload = verifyToken(token)!
    const expected24h = 24 * 60 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(before + expected24h)
  })
})

describe('generateDeclineToken', () => {
  it('produces a verifiable token with action "decline"', () => {
    const token = generateDeclineToken('res-xyz')
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.id).toBe('res-xyz')
    expect(payload!.action).toBe('decline')
  })
})

describe('generateCancelToken', () => {
  it('produces a verifiable token with action "cancel"', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    const token = generateCancelToken('booking-123', futureDate)
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.id).toBe('booking-123')
    expect(payload!.action).toBe('cancel')
  })

  it('expires 7 days after the experience date', () => {
    const experienceDate = new Date('2026-06-15T10:00:00')
    const token = generateCancelToken('booking-123', experienceDate)
    const payload = verifyToken(token)!
    const expectedExpiry = new Date('2026-06-22T10:00:00').getTime()
    expect(payload.exp).toBe(expectedExpiry)
  })
})

describe('generateCompleteToken', () => {
  it('produces a verifiable token with action "complete"', () => {
    const token = generateCompleteToken('booking-456')
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.id).toBe('booking-456')
    expect(payload!.action).toBe('complete')
  })

  it('defaults to 14-day expiry', () => {
    const before = Date.now()
    const token = generateCompleteToken('booking-456')
    const payload = verifyToken(token)!
    const expected14d = 14 * 24 * 60 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(before + expected14d)
  })
})

describe('generateNoExperienceToken', () => {
  it('produces a verifiable token with action "no-experience"', () => {
    const token = generateNoExperienceToken('booking-789')
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.id).toBe('booking-789')
    expect(payload!.action).toBe('no-experience')
  })

  it('defaults to 14-day expiry', () => {
    const before = Date.now()
    const token = generateNoExperienceToken('booking-789')
    const payload = verifyToken(token)!
    const expected14d = 14 * 24 * 60 * 60 * 1000
    expect(payload.exp).toBeGreaterThanOrEqual(before + expected14d)
  })
})
