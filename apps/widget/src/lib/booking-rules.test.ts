import { describe, it, expect } from 'vitest'
import {
  resolveCommissionRates,
  resolveExperienceDate,
  computeRentalDaysFromDates,
  buildBookingRecord,
  verifyCommissionSplitIntegrity,
} from './booking-rules'
import { calculateCommissionSplit } from './commission'

// ---------------------------------------------------------------------------
// resolveCommissionRates
// ---------------------------------------------------------------------------
describe('resolveCommissionRates', () => {
  it('returns SELF_OWNED rates for direct bookings', () => {
    const result = resolveCommissionRates({ isDirect: true })
    expect(result.rates).toEqual({
      commission_supplier: 92,
      commission_hotel: 0,
      commission_platform: 8,
    })
    expect(result.error).toBeUndefined()
  })

  it('ignores distribution for direct bookings even if provided', () => {
    const result = resolveCommissionRates({
      isDirect: true,
      distribution: { commission_supplier: 80, commission_hotel: 12, commission_platform: 8 },
    })
    expect(result.rates!.commission_supplier).toBe(92)
  })

  it('returns distribution rates for hotel bookings', () => {
    const dist = { commission_supplier: 75, commission_hotel: 17, commission_platform: 8 }
    const result = resolveCommissionRates({ isDirect: false, distribution: dist })
    expect(result.rates).toEqual(dist)
    expect(result.error).toBeUndefined()
  })

  it('errors when hotel booking has no distribution', () => {
    const result = resolveCommissionRates({ isDirect: false, distribution: null })
    expect(result.rates).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('errors when hotel booking has undefined distribution', () => {
    const result = resolveCommissionRates({ isDirect: false })
    expect(result.rates).toBeNull()
    expect(result.error).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// resolveExperienceDate
// ---------------------------------------------------------------------------
describe('resolveExperienceDate', () => {
  it('prefers rental start date for rentals', () => {
    expect(resolveExperienceDate({
      isRental: true,
      rentalStartDate: '2026-04-01',
      sessionDate: '2026-04-05',
      requestedDate: '2026-04-10',
    })).toBe('2026-04-01')
  })

  it('falls back to session date for non-rentals', () => {
    expect(resolveExperienceDate({
      isRental: false,
      rentalStartDate: null,
      sessionDate: '2026-04-05',
      requestedDate: '2026-04-10',
    })).toBe('2026-04-05')
  })

  it('falls back to requested date when no session', () => {
    expect(resolveExperienceDate({
      isRental: false,
      rentalStartDate: null,
      sessionDate: null,
      requestedDate: '2026-04-10',
    })).toBe('2026-04-10')
  })

  it('returns empty string when no dates available', () => {
    expect(resolveExperienceDate({
      isRental: false,
      rentalStartDate: null,
      sessionDate: null,
      requestedDate: null,
    })).toBe('')
  })

  it('falls through to session/requested for rental without start date', () => {
    expect(resolveExperienceDate({
      isRental: true,
      rentalStartDate: null,
      sessionDate: '2026-04-05',
      requestedDate: null,
    })).toBe('2026-04-05')
  })
})

// ---------------------------------------------------------------------------
// computeRentalDaysFromDates
// ---------------------------------------------------------------------------
describe('computeRentalDaysFromDates', () => {
  it('computes 1 day for same start and end', () => {
    expect(computeRentalDaysFromDates('2026-04-01', '2026-04-01')).toBe(1)
  })

  it('computes 3 days for Apr 1 to Apr 3', () => {
    expect(computeRentalDaysFromDates('2026-04-01', '2026-04-03')).toBe(3)
  })

  it('computes 7 days for a week rental', () => {
    expect(computeRentalDaysFromDates('2026-04-01', '2026-04-07')).toBe(7)
  })

  it('handles month boundary', () => {
    expect(computeRentalDaysFromDates('2026-03-30', '2026-04-02')).toBe(4)
  })

  it('returns minimum 1 even for degenerate input', () => {
    expect(computeRentalDaysFromDates('2026-04-05', '2026-04-03')).toBe(1)
  })

  it('returns undefined when start date is null', () => {
    expect(computeRentalDaysFromDates(null, '2026-04-03')).toBeUndefined()
  })

  it('returns undefined when end date is null', () => {
    expect(computeRentalDaysFromDates('2026-04-01', null)).toBeUndefined()
  })

  it('returns undefined when both are null', () => {
    expect(computeRentalDaysFromDates(null, null)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// buildBookingRecord
// ---------------------------------------------------------------------------
describe('buildBookingRecord', () => {
  const split = {
    supplierAmount: 4000,
    hotelAmount: 600,
    platformAmount: 400,
    total: 5000,
  }

  it('builds a complete booking record', () => {
    const record = buildBookingRecord({
      reservationId: 'res-123',
      sessionId: 'sess-456',
      totalCents: 5000,
      split,
      paymentIntentId: 'pi_abc',
      chargeId: 'ch_def',
    })

    expect(record.reservation_id).toBe('res-123')
    expect(record.session_id).toBe('sess-456')
    expect(record.amount_cents).toBe(5000)
    expect(record.supplier_amount_cents).toBe(4000)
    expect(record.hotel_amount_cents).toBe(600)
    expect(record.platform_amount_cents).toBe(400)
    expect(record.stripe_payment_intent_id).toBe('pi_abc')
    expect(record.stripe_charge_id).toBe('ch_def')
    expect(record.booking_status).toBe('confirmed')
    expect(record.paid_at).toBeDefined()
  })

  it('sets session_id to null when not provided', () => {
    const record = buildBookingRecord({
      reservationId: 'res-123',
      sessionId: null,
      totalCents: 5000,
      split,
      paymentIntentId: 'pi_abc',
      chargeId: 'ch_def',
    })
    expect(record.session_id).toBeNull()
  })

  it('preserves amount invariant: amounts match the split', () => {
    const record = buildBookingRecord({
      reservationId: 'res-123',
      totalCents: 5000,
      split,
      paymentIntentId: 'pi_abc',
      chargeId: 'ch_def',
    })
    const sum = record.supplier_amount_cents + record.hotel_amount_cents + record.platform_amount_cents
    expect(sum).toBe(record.amount_cents)
  })
})

// ---------------------------------------------------------------------------
// verifyCommissionSplitIntegrity
// ---------------------------------------------------------------------------
describe('verifyCommissionSplitIntegrity', () => {
  it('returns true when amounts sum to total', () => {
    expect(verifyCommissionSplitIntegrity({
      supplierAmount: 4000,
      hotelAmount: 600,
      platformAmount: 400,
      total: 5000,
    })).toBe(true)
  })

  it('returns false when amounts do not sum to total', () => {
    expect(verifyCommissionSplitIntegrity({
      supplierAmount: 4000,
      hotelAmount: 600,
      platformAmount: 401,
      total: 5000,
    })).toBe(false)
  })

  it('validates real commission splits from calculateCommissionSplit', () => {
    const split = calculateCommissionSplit(9999, {
      commission_supplier: 80,
      commission_hotel: 12,
      commission_platform: 8,
    })
    expect(verifyCommissionSplitIntegrity(split)).toBe(true)
  })

  it('validates direct channel splits', () => {
    const split = calculateCommissionSplit(14750, {
      commission_supplier: 92,
      commission_hotel: 0,
      commission_platform: 8,
    })
    expect(verifyCommissionSplitIntegrity(split)).toBe(true)
  })

  it('validates edge case: 1 cent total', () => {
    const split = calculateCommissionSplit(1, {
      commission_supplier: 80,
      commission_hotel: 12,
      commission_platform: 8,
    })
    expect(verifyCommissionSplitIntegrity(split)).toBe(true)
  })

  it('validates edge case: large total', () => {
    const split = calculateCommissionSplit(99999999, {
      commission_supplier: 80,
      commission_hotel: 12,
      commission_platform: 8,
    })
    expect(verifyCommissionSplitIntegrity(split)).toBe(true)
  })
})
