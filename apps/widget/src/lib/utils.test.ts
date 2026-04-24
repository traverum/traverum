import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatDuration,
  formatDate,
  formatTime,
  darkenColor,
  lightenColor,
  getEmbedMode,
  truncate,
  hexToHsl,
  shuffleWithSeed,
  hashString,
} from './utils'

describe('formatPrice (widget)', () => {
  it('formats whole euros with no decimals', () => {
    const result = formatPrice(5000)
    expect(result).toContain('50')
    expect(result).toContain('€')
  })

  it('formats cents with decimals', () => {
    const result = formatPrice(1299)
    expect(result).toContain('12')
    expect(result).toContain('99')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('includes currency symbol', () => {
    expect(formatPrice(100)).toContain('€')
  })
})

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(45)).toBe('45 min')
  })

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours with minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min')
    expect(formatDuration(150)).toBe('2h 30min')
  })

  it('formats single minute', () => {
    expect(formatDuration(1)).toBe('1 min')
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD string with month name', () => {
    expect(formatDate('2026-03-20')).toBe('20 Mar 2026')
  })

  it('formats short with month name', () => {
    expect(formatDate('2026-03-20', { short: true })).toBe('20 Mar')
  })

  it('formats Date object', () => {
    const date = new Date(2026, 2, 20)
    expect(formatDate(date)).toBe('20 Mar 2026')
  })

  it('formats Date object short', () => {
    const date = new Date(2026, 0, 5)
    expect(formatDate(date, { short: true })).toBe('5 Jan')
  })

  it('formats single-digit day without padding', () => {
    expect(formatDate('2026-01-05')).toBe('5 Jan 2026')
  })

  it('uses globally unambiguous format', () => {
    const result = formatDate('2026-12-25')
    expect(result).toBe('25 Dec 2026')
    expect(result).not.toContain('/')
    expect(result).not.toContain('.')
  })
})

describe('formatTime', () => {
  it('strips seconds from HH:MM:SS', () => {
    expect(formatTime('14:30:00')).toBe('14:30')
  })

  it('passes through HH:MM unchanged', () => {
    expect(formatTime('09:00')).toBe('09:00')
  })

  it('handles midnight', () => {
    expect(formatTime('00:00:00')).toBe('00:00')
  })
})

describe('darkenColor', () => {
  it('darkens white', () => {
    const result = darkenColor('#ffffff', 50)
    expect(result).toBe('#7f7f7f')
  })

  it('darkens with # prefix', () => {
    const result = darkenColor('#ff0000', 50)
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('produces a different color', () => {
    expect(darkenColor('#aabbcc')).not.toBe('#aabbcc')
  })

  it('handles already black', () => {
    expect(darkenColor('#000000', 50)).toBe('#000000')
  })
})

describe('lightenColor', () => {
  it('lightens black', () => {
    const result = lightenColor('#000000', 50)
    expect(result).toBe('#7f7f7f')
  })

  it('produces a different color', () => {
    expect(lightenColor('#334455')).not.toBe('#334455')
  })

  it('handles already white', () => {
    expect(lightenColor('#ffffff', 50)).toBe('#ffffff')
  })
})

describe('getEmbedMode', () => {
  it('returns "section" when embed=section', () => {
    expect(getEmbedMode({ embed: 'section' })).toBe('section')
  })

  it('returns "full" by default', () => {
    expect(getEmbedMode({})).toBe('full')
  })

  it('returns "full" for unknown value', () => {
    expect(getEmbedMode({ embed: 'unknown' })).toBe('full')
  })
})

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates with ellipsis', () => {
    expect(truncate('hello world this is long', 10)).toBe('hello w...')
  })

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

describe('shuffleWithSeed', () => {
  const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  it('returns a new array (does not mutate input)', () => {
    const copy = [...input]
    shuffleWithSeed(input, 'seed')
    expect(input).toEqual(copy)
  })

  it('preserves all items', () => {
    const shuffled = shuffleWithSeed(input, 'seed')
    expect(shuffled.slice().sort()).toEqual(input.slice().sort())
    expect(shuffled).toHaveLength(input.length)
  })

  it('is deterministic for the same seed', () => {
    const a = shuffleWithSeed(input, 'abc-123')
    const b = shuffleWithSeed(input, 'abc-123')
    expect(a).toEqual(b)
  })

  it('produces different orders for different seeds', () => {
    const a = shuffleWithSeed(input, 'seed-one')
    const b = shuffleWithSeed(input, 'seed-two')
    expect(a).not.toEqual(b)
  })

  it('handles empty and single-item arrays', () => {
    expect(shuffleWithSeed([], 'x')).toEqual([])
    expect(shuffleWithSeed(['only'], 'x')).toEqual(['only'])
  })

  it('accepts numeric seeds', () => {
    const a = shuffleWithSeed(input, 42)
    const b = shuffleWithSeed(input, 42)
    expect(a).toEqual(b)
  })
})

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('hello')).toBe(hashString('hello'))
  })

  it('produces different hashes for different inputs', () => {
    expect(hashString('hello')).not.toBe(hashString('world'))
  })

  it('returns a 32-bit unsigned integer', () => {
    const h = hashString('anything')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThanOrEqual(0xffffffff)
    expect(Number.isInteger(h)).toBe(true)
  })
})

describe('hexToHsl', () => {
  it('converts pure red', () => {
    const result = hexToHsl('#ff0000')
    expect(result).toBe('0 100% 50%')
  })

  it('converts black', () => {
    expect(hexToHsl('#000000')).toBe('0 0% 0%')
  })

  it('converts white', () => {
    expect(hexToHsl('#ffffff')).toBe('0 0% 100%')
  })

  it('handles 3-char shorthand', () => {
    const result = hexToHsl('#f00')
    expect(result).toBe('0 100% 50%')
  })

  it('falls back to neutral grey for invalid input', () => {
    expect(hexToHsl('not-a-color')).toBe('0 0% 50%')
  })

  it('falls back for empty string', () => {
    expect(hexToHsl('')).toBe('0 0% 50%')
  })
})
