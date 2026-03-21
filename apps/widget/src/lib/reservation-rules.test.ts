import { describe, it, expect } from 'vitest'
import {
  validateRequiredFields,
  validateParticipants,
  validateRentalRequest,
  validatePriceMatch,
  computeRentalEndDate,
  normalizeRequestTime,
  resolveAutoDistributionRates,
} from './reservation-rules'

// ---------------------------------------------------------------------------
// validateRequiredFields
// ---------------------------------------------------------------------------
describe('validateRequiredFields', () => {
  const validHotelBooking = {
    hotelSlug: 'grand-hotel',
    experienceId: 'exp-1',
    participants: 2,
    totalCents: 5000,
    guestName: 'John',
    guestEmail: 'john@example.com',
    isDirect: false,
  }

  const validDirectBooking = {
    ...validHotelBooking,
    hotelSlug: null,
    isDirect: true,
  }

  it('accepts a valid hotel booking', () => {
    expect(validateRequiredFields(validHotelBooking)).toEqual({ valid: true })
  })

  it('accepts a valid direct booking without hotelSlug', () => {
    expect(validateRequiredFields(validDirectBooking)).toEqual({ valid: true })
  })

  it('rejects hotel booking without slug', () => {
    const result = validateRequiredFields({ ...validHotelBooking, hotelSlug: null })
    expect(result.valid).toBe(false)
  })

  it('rejects missing experienceId', () => {
    const result = validateRequiredFields({ ...validHotelBooking, experienceId: null })
    expect(result.valid).toBe(false)
  })

  it('rejects missing participants', () => {
    const result = validateRequiredFields({ ...validHotelBooking, participants: 0 })
    expect(result.valid).toBe(false)
  })

  it('rejects missing totalCents', () => {
    const result = validateRequiredFields({ ...validHotelBooking, totalCents: 0 })
    expect(result.valid).toBe(false)
  })

  it('rejects missing guestName', () => {
    const result = validateRequiredFields({ ...validHotelBooking, guestName: '' })
    expect(result.valid).toBe(false)
  })

  it('rejects missing guestEmail', () => {
    const result = validateRequiredFields({ ...validHotelBooking, guestEmail: '' })
    expect(result.valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateParticipants
// ---------------------------------------------------------------------------
describe('validateParticipants', () => {
  it('accepts participants within range', () => {
    expect(validateParticipants(3, 10, false)).toEqual({ valid: true })
  })

  it('accepts exactly 1 participant', () => {
    expect(validateParticipants(1, 10, false)).toEqual({ valid: true })
  })

  it('accepts max participants', () => {
    expect(validateParticipants(10, 10, false)).toEqual({ valid: true })
  })

  it('rejects 0 participants', () => {
    const result = validateParticipants(0, 10, false)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('1 and 10')
  })

  it('rejects negative participants', () => {
    expect(validateParticipants(-1, 10, false).valid).toBe(false)
  })

  it('rejects exceeding max', () => {
    const result = validateParticipants(11, 10, false)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('10')
  })

  it('skips validation for rentals', () => {
    expect(validateParticipants(0, 10, true)).toEqual({ valid: true })
    expect(validateParticipants(999, 10, true)).toEqual({ valid: true })
  })
})

// ---------------------------------------------------------------------------
// validateRentalRequest
// ---------------------------------------------------------------------------
describe('validateRentalRequest', () => {
  it('accepts valid rental request', () => {
    const result = validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 3,
      minDays: 1,
      maxDays: 7,
    })
    expect(result).toEqual({ valid: true })
  })

  it('rejects missing start date', () => {
    const result = validateRentalRequest({
      requestDate: null,
      rentalDays: 3,
      minDays: 1,
      maxDays: 7,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('start date')
  })

  it('rejects zero rental days', () => {
    const result = validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 0,
      minDays: 1,
      maxDays: 7,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('rental days')
  })

  it('rejects below minimum days', () => {
    const result = validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 1,
      minDays: 3,
      maxDays: 7,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('3 days')
  })

  it('rejects above maximum days', () => {
    const result = validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 10,
      minDays: 1,
      maxDays: 7,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('7 days')
  })

  it('accepts any duration when maxDays is null', () => {
    const result = validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 365,
      minDays: 1,
      maxDays: null,
    })
    expect(result).toEqual({ valid: true })
  })

  it('accepts exactly minDays', () => {
    expect(validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 3,
      minDays: 3,
      maxDays: 7,
    })).toEqual({ valid: true })
  })

  it('accepts exactly maxDays', () => {
    expect(validateRentalRequest({
      requestDate: '2026-04-01',
      rentalDays: 7,
      minDays: 1,
      maxDays: 7,
    })).toEqual({ valid: true })
  })
})

// ---------------------------------------------------------------------------
// validatePriceMatch
// ---------------------------------------------------------------------------
describe('validatePriceMatch', () => {
  it('accepts exact match', () => {
    expect(validatePriceMatch(5000, 5000)).toEqual({ valid: true })
  })

  it('accepts 1 cent rounding difference', () => {
    expect(validatePriceMatch(5001, 5000)).toEqual({ valid: true })
    expect(validatePriceMatch(4999, 5000)).toEqual({ valid: true })
  })

  it('rejects 2 cent difference', () => {
    expect(validatePriceMatch(5002, 5000).valid).toBe(false)
    expect(validatePriceMatch(4998, 5000).valid).toBe(false)
  })

  it('rejects large discrepancy', () => {
    const result = validatePriceMatch(10000, 5000)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Price mismatch')
  })
})

// ---------------------------------------------------------------------------
// computeRentalEndDate
// ---------------------------------------------------------------------------
describe('computeRentalEndDate', () => {
  it('1-day rental ends on the start date', () => {
    expect(computeRentalEndDate('2026-04-01', 1)).toBe('2026-04-01')
  })

  it('3-day rental: Apr 1 + 3 days = Apr 3', () => {
    expect(computeRentalEndDate('2026-04-01', 3)).toBe('2026-04-03')
  })

  it('handles month boundary', () => {
    expect(computeRentalEndDate('2026-03-30', 5)).toBe('2026-04-03')
  })

  it('handles year boundary', () => {
    expect(computeRentalEndDate('2026-12-30', 5)).toBe('2027-01-03')
  })

  it('handles leap year', () => {
    expect(computeRentalEndDate('2028-02-27', 3)).toBe('2028-02-29')
  })
})

// ---------------------------------------------------------------------------
// normalizeRequestTime
// ---------------------------------------------------------------------------
describe('normalizeRequestTime', () => {
  it('appends :00 to HH:MM format', () => {
    expect(normalizeRequestTime('14:30')).toBe('14:30:00')
  })

  it('leaves HH:MM:SS unchanged', () => {
    expect(normalizeRequestTime('14:30:00')).toBe('14:30:00')
  })

  it('handles midnight', () => {
    expect(normalizeRequestTime('00:00')).toBe('00:00:00')
  })
})

// ---------------------------------------------------------------------------
// resolveAutoDistributionRates
// ---------------------------------------------------------------------------
describe('resolveAutoDistributionRates', () => {
  it('returns self-owned rates (92/0/8) when hotel owns the experience', () => {
    const rates = resolveAutoDistributionRates(true)
    expect(rates.commission_supplier).toBe(92)
    expect(rates.commission_hotel).toBe(0)
    expect(rates.commission_platform).toBe(8)
    expect(rates.commission_supplier + rates.commission_hotel + rates.commission_platform).toBe(100)
  })

  it('returns default rates (80/12/8) when hotel does not own the experience', () => {
    const rates = resolveAutoDistributionRates(false)
    expect(rates.commission_supplier).toBe(80)
    expect(rates.commission_hotel).toBe(12)
    expect(rates.commission_platform).toBe(8)
    expect(rates.commission_supplier + rates.commission_hotel + rates.commission_platform).toBe(100)
  })
})
