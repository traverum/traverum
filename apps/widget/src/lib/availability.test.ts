import { describe, it, expect } from 'vitest'
import {
  isDateAvailable,
  getOperatingHours,
  generateTimeSlots,
  groupTimeSlots,
  getCancellationPolicyText,
  getCancellationPolicyExperienceIntro,
  canGuestCancel,
  type AvailabilityRule,
} from './availability'

const makeRule = (overrides: Partial<AvailabilityRule> = {}): AvailabilityRule => ({
  id: 'rule-1',
  experience_id: 'exp-1',
  weekdays: [1, 2, 3, 4, 5], // Mon-Fri
  start_time: '09:00',
  end_time: '17:00',
  valid_from: null,
  valid_until: null,
  ...overrides,
})

describe('isDateAvailable', () => {
  it('returns true when no rules (everything available)', () => {
    expect(isDateAvailable(new Date(2026, 2, 20), [])).toBe(true)
  })

  it('returns true for a weekday matching the rule', () => {
    // March 20, 2026 is a Friday (day 5)
    expect(isDateAvailable(new Date(2026, 2, 20), [makeRule()])).toBe(true)
  })

  it('returns false for a weekend when rule only has weekdays', () => {
    // March 21, 2026 is a Saturday (day 6)
    expect(isDateAvailable(new Date(2026, 2, 21), [makeRule()])).toBe(false)
  })

  it('handles seasonal rules (summer only)', () => {
    const summerRule = makeRule({ valid_from: '06-01', valid_until: '08-31' })
    expect(isDateAvailable(new Date(2026, 6, 15), [summerRule])).toBe(true)
    expect(isDateAvailable(new Date(2026, 2, 20), [summerRule])).toBe(false)
  })

  it('handles wrap-around seasons (winter: Nov-Mar)', () => {
    const winterRule = makeRule({ valid_from: '11-01', valid_until: '03-31' })
    expect(isDateAvailable(new Date(2026, 0, 15), [winterRule])).toBe(true)
    expect(isDateAvailable(new Date(2026, 10, 3), [winterRule])).toBe(true)
    expect(isDateAvailable(new Date(2026, 5, 15), [winterRule])).toBe(false)
  })

  it('matches any of multiple rules', () => {
    const weekdayRule = makeRule({ weekdays: [1, 2, 3, 4, 5] })
    const weekendRule = makeRule({ id: 'rule-2', weekdays: [0, 6] })
    expect(isDateAvailable(new Date(2026, 2, 21), [weekdayRule, weekendRule])).toBe(true)
  })
})

describe('getOperatingHours', () => {
  it('returns null when no rules', () => {
    expect(getOperatingHours(new Date(2026, 2, 20), [])).toBeNull()
  })

  it('returns hours for matching day', () => {
    const result = getOperatingHours(new Date(2026, 2, 20), [makeRule()])
    expect(result).toEqual({ start: '09:00', end: '17:00' })
  })

  it('returns null for non-matching day', () => {
    expect(getOperatingHours(new Date(2026, 2, 21), [makeRule()])).toBeNull()
  })
})

describe('generateTimeSlots', () => {
  it('generates hourly slots', () => {
    const slots = generateTimeSlots('09:00', '12:00')
    expect(slots).toEqual(['09:00', '10:00', '11:00'])
  })

  it('includes end hour when minutes > 0', () => {
    const slots = generateTimeSlots('09:00', '12:30')
    expect(slots).toEqual(['09:00', '10:00', '11:00', '12:00'])
  })

  it('returns empty for same start and end', () => {
    const slots = generateTimeSlots('09:00', '09:00')
    expect(slots).toEqual([])
  })

  it('generates full day slots', () => {
    const slots = generateTimeSlots('08:00', '20:00')
    expect(slots).toHaveLength(12)
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('19:00')
  })

  it('pads hours with leading zero', () => {
    const slots = generateTimeSlots('08:00', '10:00')
    expect(slots[0]).toBe('08:00')
    expect(slots[1]).toBe('09:00')
  })
})

describe('groupTimeSlots', () => {
  it('groups into morning/afternoon/evening', () => {
    const slots = ['08:00', '09:00', '10:00', '12:00', '14:00', '18:00', '20:00']
    const result = groupTimeSlots(slots)
    expect(result.morning).toEqual(['08:00', '09:00', '10:00'])
    expect(result.afternoon).toEqual(['12:00', '14:00'])
    expect(result.evening).toEqual(['18:00', '20:00'])
  })

  it('handles empty slots', () => {
    const result = groupTimeSlots([])
    expect(result.morning).toEqual([])
    expect(result.afternoon).toEqual([])
    expect(result.evening).toEqual([])
  })

  it('morning is before 12', () => {
    const result = groupTimeSlots(['11:00'])
    expect(result.morning).toEqual(['11:00'])
    expect(result.afternoon).toEqual([])
  })

  it('afternoon is 12-17', () => {
    const result = groupTimeSlots(['12:00', '17:00'])
    expect(result.afternoon).toEqual(['12:00', '17:00'])
  })

  it('evening starts at 18', () => {
    const result = groupTimeSlots(['18:00'])
    expect(result.evening).toEqual(['18:00'])
    expect(result.afternoon).toEqual([])
  })
})

describe('getCancellationPolicyText', () => {
  it('flexible policy text', () => {
    const text = getCancellationPolicyText('flexible')
    expect(text).toContain('24 hours')
    expect(text).toContain('weather or emergency')
  })

  it('moderate policy text', () => {
    const text = getCancellationPolicyText('moderate')
    expect(text).toContain('7 days')
  })

  it('strict policy text', () => {
    const text = getCancellationPolicyText('strict')
    expect(text).toContain('No refunds')
  })

  it('non_refundable policy text', () => {
    const text = getCancellationPolicyText('non_refundable')
    expect(text).toContain('No refunds')
  })

  it('defaults to moderate for null', () => {
    const text = getCancellationPolicyText(null)
    expect(text).toContain('7 days')
  })

  it('defaults to moderate for undefined', () => {
    const text = getCancellationPolicyText(undefined)
    expect(text).toContain('7 days')
  })
})

describe('getCancellationPolicyExperienceIntro', () => {
  it('flexible adds "before the activity"', () => {
    const text = getCancellationPolicyExperienceIntro('flexible')
    expect(text).toContain('before the activity')
  })

  it('moderate adds "before the activity"', () => {
    const text = getCancellationPolicyExperienceIntro('moderate')
    expect(text).toContain('before the activity')
  })

  it('strict does not add "before the activity"', () => {
    const text = getCancellationPolicyExperienceIntro('strict')
    expect(text).not.toContain('before the activity')
  })
})

describe('canGuestCancel', () => {
  it('flexible: can cancel 2 days before', () => {
    const result = canGuestCancel('flexible', 2)
    expect(result.canCancel).toBe(true)
  })

  it('flexible: cannot cancel 0 days before', () => {
    const result = canGuestCancel('flexible', 0)
    expect(result.canCancel).toBe(false)
  })

  it('moderate: can cancel 10 days before', () => {
    const result = canGuestCancel('moderate', 10)
    expect(result.canCancel).toBe(true)
  })

  it('moderate: cannot cancel 3 days before', () => {
    const result = canGuestCancel('moderate', 3)
    expect(result.canCancel).toBe(false)
    expect(result.message).toContain('7 days')
  })

  it('strict: can never cancel', () => {
    const result = canGuestCancel('strict', 30)
    expect(result.canCancel).toBe(false)
  })

  it('non_refundable: can never cancel', () => {
    const result = canGuestCancel('non_refundable', 30)
    expect(result.canCancel).toBe(false)
    expect(result.message).toContain('non-refundable')
  })

  it('null defaults to moderate', () => {
    const result = canGuestCancel(null, 10)
    expect(result.canCancel).toBe(true)
  })

  it('null defaults to moderate (too late)', () => {
    const result = canGuestCancel(null, 3)
    expect(result.canCancel).toBe(false)
  })
})
