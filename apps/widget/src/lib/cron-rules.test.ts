import { describe, it, expect } from 'vitest'
import {
  shouldAutoComplete,
  shouldExpirePending,
  shouldExpireUnpaid,
  isCompletionCheckDue,
  resolveBookingExperienceDate,
  computeEndTime,
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
  it('returns true when end_time has passed', () => {
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T16:00:00.000Z', '15:00')).toBe(true)
  })

  it('returns false when end_time has not passed yet', () => {
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T14:00:00.000Z', '15:00')).toBe(false)
  })

  it('returns true at exact end_time', () => {
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T15:00:00.000Z', '15:00')).toBe(true)
  })

  it('computes end time from start_time + duration when no end_time', () => {
    // 10:00 + 120 min = 12:00 — now is 13:00 → due
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T13:00:00.000Z', null, '10:00', 120)).toBe(true)
  })

  it('returns false when computed end time has not passed', () => {
    // 10:00 + 120 min = 12:00 — now is 11:00 → not due
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T11:00:00.000Z', null, '10:00', 120)).toBe(false)
  })

  it('falls back to day-after when no time info available', () => {
    // No end_time, no start_time, no duration → fires after midnight next day
    expect(isCompletionCheckDue('2026-03-19', '2026-03-20T00:00:00.000Z')).toBe(true)
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T23:59:00.000Z')).toBe(false)
  })

  it('returns false when experience is in the future', () => {
    expect(isCompletionCheckDue('2026-04-01', '2026-03-20T12:00:00.000Z', '10:00')).toBe(false)
  })

  it('returns false when experience date is null', () => {
    expect(isCompletionCheckDue(null, '2026-03-20T12:00:00.000Z')).toBe(false)
  })

  it('returns false when experience date is undefined', () => {
    expect(isCompletionCheckDue(undefined, '2026-03-20T12:00:00.000Z')).toBe(false)
  })

  it('prefers end_time over start_time + duration', () => {
    // end_time says 14:00, start+duration would say 12:00
    // now is 13:00 — should NOT be due since end_time (14:00) hasn't passed
    expect(isCompletionCheckDue('2026-03-20', '2026-03-20T13:00:00.000Z', '14:00', '10:00', 120)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// computeEndTime
// ---------------------------------------------------------------------------
describe('computeEndTime', () => {
  it('adds duration to start time', () => {
    expect(computeEndTime('10:00', 120)).toBe('12:00')
  })

  it('handles crossing hour boundaries', () => {
    expect(computeEndTime('10:45', 30)).toBe('11:15')
  })

  it('wraps past midnight', () => {
    expect(computeEndTime('23:00', 120)).toBe('01:00')
  })

  it('returns null when start_time is null', () => {
    expect(computeEndTime(null, 120)).toBeNull()
  })

  it('returns null when duration is null', () => {
    expect(computeEndTime('10:00', null)).toBeNull()
  })

  it('returns null when both are missing', () => {
    expect(computeEndTime(null, null)).toBeNull()
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
