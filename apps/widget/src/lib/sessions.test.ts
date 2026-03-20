import { describe, it, expect } from 'vitest'
import { groupSessionsByDate, getAvailableDates } from './sessions'

const makeSession = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  experience_id: 'exp-1',
  session_date: '2026-03-25',
  start_time: '10:00',
  spots_total: 10,
  spots_available: 5,
  session_status: 'available',
  price_override_cents: null,
  price_note: null,
  session_language: null,
  created_at: null,
  updated_at: null,
  ...overrides,
})

describe('groupSessionsByDate', () => {
  it('returns empty map for empty array', () => {
    const result = groupSessionsByDate([])
    expect(result.size).toBe(0)
  })

  it('groups sessions by their session_date', () => {
    const sessions = [
      makeSession({ id: 's1', session_date: '2026-03-25' }),
      makeSession({ id: 's2', session_date: '2026-03-26' }),
      makeSession({ id: 's3', session_date: '2026-03-25' }),
    ]
    const result = groupSessionsByDate(sessions)
    expect(result.size).toBe(2)
    expect(result.get('2026-03-25')).toHaveLength(2)
    expect(result.get('2026-03-26')).toHaveLength(1)
  })

  it('handles single session', () => {
    const sessions = [makeSession()]
    const result = groupSessionsByDate(sessions)
    expect(result.size).toBe(1)
    expect(result.get('2026-03-25')).toHaveLength(1)
  })

  it('preserves session data in groups', () => {
    const sessions = [
      makeSession({ id: 's1', session_date: '2026-03-25', start_time: '09:00' }),
      makeSession({ id: 's2', session_date: '2026-03-25', start_time: '14:00' }),
    ]
    const result = groupSessionsByDate(sessions)
    const group = result.get('2026-03-25')!
    expect(group[0].id).toBe('s1')
    expect(group[0].start_time).toBe('09:00')
    expect(group[1].id).toBe('s2')
    expect(group[1].start_time).toBe('14:00')
  })
})

describe('getAvailableDates', () => {
  it('returns empty array for empty input', () => {
    expect(getAvailableDates([])).toEqual([])
  })

  it('returns unique sorted dates', () => {
    const sessions = [
      makeSession({ session_date: '2026-03-27' }),
      makeSession({ session_date: '2026-03-25' }),
      makeSession({ session_date: '2026-03-26' }),
    ]
    expect(getAvailableDates(sessions)).toEqual([
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
    ])
  })

  it('deduplicates dates with multiple sessions', () => {
    const sessions = [
      makeSession({ id: 's1', session_date: '2026-03-25' }),
      makeSession({ id: 's2', session_date: '2026-03-25' }),
      makeSession({ id: 's3', session_date: '2026-03-26' }),
    ]
    const result = getAvailableDates(sessions)
    expect(result).toEqual(['2026-03-25', '2026-03-26'])
  })

  it('handles single session', () => {
    const sessions = [makeSession({ session_date: '2026-04-01' })]
    expect(getAvailableDates(sessions)).toEqual(['2026-04-01'])
  })
})
