import { describe, it, expect } from 'vitest'
import {
  shouldAutoComplete,
  shouldExpirePending,
  shouldExpireUnpaid,
  isCompletionCheckDue,
  resolveBookingExperienceDate,
} from './cron-rules'

// ---------------------------------------------------------------------------
// shouldAutoComplete
// ---------------------------------------------------------------------------
describe('shouldAutoComplete', () => {
  const sevenDaysAgo = '2026-03-13'

  it('returns true when experience was exactly 7 days ago', () => {
    expect(shouldAutoComplete('2026-03-13', sevenDaysAgo)).toBe(true)
  })

  it('returns true when experience was more than 7 days ago', () => {
    expect(shouldAutoComplete('2026-03-01', sevenDaysAgo)).toBe(true)
  })

  it('returns false when experience was 6 days ago', () => {
    expect(shouldAutoComplete('2026-03-14', sevenDaysAgo)).toBe(false)
  })

  it('returns false when experience is today', () => {
    expect(shouldAutoComplete('2026-03-20', sevenDaysAgo)).toBe(false)
  })

  it('returns false when experience is in the future', () => {
    expect(shouldAutoComplete('2026-04-01', sevenDaysAgo)).toBe(false)
  })

  it('returns false when experience date is null', () => {
    expect(shouldAutoComplete(null, sevenDaysAgo)).toBe(false)
  })

  it('returns false when experience date is undefined', () => {
    expect(shouldAutoComplete(undefined, sevenDaysAgo)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// shouldExpirePending
// ---------------------------------------------------------------------------
describe('shouldExpirePending', () => {
  const now = '2026-03-20T14:00:00.000Z'

  it('expires pending reservation past deadline', () => {
    expect(shouldExpirePending('pending', '2026-03-20T12:00:00.000Z', now)).toBe(true)
  })

  it('does not expire pending reservation before deadline', () => {
    expect(shouldExpirePending('pending', '2026-03-20T16:00:00.000Z', now)).toBe(false)
  })

  it('does not expire non-pending reservations', () => {
    expect(shouldExpirePending('approved', '2026-03-20T12:00:00.000Z', now)).toBe(false)
    expect(shouldExpirePending('expired', '2026-03-20T12:00:00.000Z', now)).toBe(false)
    expect(shouldExpirePending('cancelled', '2026-03-20T12:00:00.000Z', now)).toBe(false)
  })

  it('does not expire at exact deadline time', () => {
    expect(shouldExpirePending('pending', now, now)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// shouldExpireUnpaid
// ---------------------------------------------------------------------------
describe('shouldExpireUnpaid', () => {
  const now = '2026-03-20T14:00:00.000Z'

  it('expires approved reservation past payment deadline with no booking', () => {
    expect(shouldExpireUnpaid('approved', '2026-03-20T12:00:00.000Z', now, false)).toBe(true)
  })

  it('does not expire if booking already exists (race condition protection)', () => {
    expect(shouldExpireUnpaid('approved', '2026-03-20T12:00:00.000Z', now, true)).toBe(false)
  })

  it('does not expire before payment deadline', () => {
    expect(shouldExpireUnpaid('approved', '2026-03-20T16:00:00.000Z', now, false)).toBe(false)
  })

  it('does not expire non-approved reservations', () => {
    expect(shouldExpireUnpaid('pending', '2026-03-20T12:00:00.000Z', now, false)).toBe(false)
    expect(shouldExpireUnpaid('expired', '2026-03-20T12:00:00.000Z', now, false)).toBe(false)
  })

  it('does not expire at exact deadline time', () => {
    expect(shouldExpireUnpaid('approved', now, now, false)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isCompletionCheckDue
// ---------------------------------------------------------------------------
describe('isCompletionCheckDue', () => {
  const yesterday = '2026-03-19'

  it('returns true when experience was yesterday', () => {
    expect(isCompletionCheckDue('2026-03-19', yesterday)).toBe(true)
  })

  it('returns false when experience is today', () => {
    expect(isCompletionCheckDue('2026-03-20', yesterday)).toBe(false)
  })

  it('returns false when experience was 2 days ago', () => {
    expect(isCompletionCheckDue('2026-03-18', yesterday)).toBe(false)
  })

  it('returns false when experience is in the future', () => {
    expect(isCompletionCheckDue('2026-04-01', yesterday)).toBe(false)
  })

  it('returns false when experience date is null', () => {
    expect(isCompletionCheckDue(null, yesterday)).toBe(false)
  })

  it('returns false when experience date is undefined', () => {
    expect(isCompletionCheckDue(undefined, yesterday)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolveBookingExperienceDate
// ---------------------------------------------------------------------------
describe('resolveBookingExperienceDate', () => {
  it('prefers session date over requested date', () => {
    expect(resolveBookingExperienceDate('2026-04-01', '2026-04-05')).toBe('2026-04-01')
  })

  it('falls back to requested date when no session date', () => {
    expect(resolveBookingExperienceDate(null, '2026-04-05')).toBe('2026-04-05')
    expect(resolveBookingExperienceDate(undefined, '2026-04-05')).toBe('2026-04-05')
  })

  it('returns null when both are missing', () => {
    expect(resolveBookingExperienceDate(null, null)).toBeNull()
    expect(resolveBookingExperienceDate(undefined, undefined)).toBeNull()
  })
})
