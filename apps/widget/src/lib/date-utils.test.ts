import { describe, it, expect } from 'vitest'
import { getTodayLocal, parseLocalDate } from './date-utils'

describe('getTodayLocal', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayLocal(new Date(2026, 2, 20)) // March 20, 2026
    expect(result).toBe('2026-03-20')
  })

  it('pads single-digit month and day', () => {
    const result = getTodayLocal(new Date(2026, 0, 5)) // January 5
    expect(result).toBe('2026-01-05')
  })

  it('handles Dec 31', () => {
    const result = getTodayLocal(new Date(2026, 11, 31))
    expect(result).toBe('2026-12-31')
  })

  it('handles Jan 1', () => {
    const result = getTodayLocal(new Date(2026, 0, 1))
    expect(result).toBe('2026-01-01')
  })
})

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const date = parseLocalDate('2026-03-20')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2) // March (0-indexed)
    expect(date.getDate()).toBe(20)
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })

  it('does not shift to wrong day (unlike UTC parsing)', () => {
    const date = parseLocalDate('2026-03-20')
    expect(date.getDate()).toBe(20)
  })

  it('handles end of year', () => {
    const date = parseLocalDate('2026-12-31')
    expect(date.getMonth()).toBe(11)
    expect(date.getDate()).toBe(31)
  })

  it('handles start of year', () => {
    const date = parseLocalDate('2026-01-01')
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })

  it('handles leap year date', () => {
    const date = parseLocalDate('2028-02-29')
    expect(date.getMonth()).toBe(1)
    expect(date.getDate()).toBe(29)
  })
})
