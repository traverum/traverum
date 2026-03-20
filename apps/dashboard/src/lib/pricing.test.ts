import { describe, it, expect } from 'vitest'
import {
  getUnitLabel,
  getDefaultUnitPrice,
  calculateTotalPrice,
  formatPrice,
  getPricingSummary,
  type PricingConfig,
} from './pricing'

const basePricing: PricingConfig = {
  pricing_type: 'per_person',
  base_price_cents: 0,
  included_participants: 1,
  extra_person_cents: 5000,
  price_per_day_cents: 0,
  min_participants: 1,
  max_participants: 10,
}

describe('getUnitLabel', () => {
  it('per_person -> "per person"', () => {
    expect(getUnitLabel('per_person')).toBe('per person')
  })

  it('flat_rate -> "total"', () => {
    expect(getUnitLabel('flat_rate')).toBe('total')
  })

  it('base_plus_extra -> "per person"', () => {
    expect(getUnitLabel('base_plus_extra')).toBe('per person')
  })

  it('per_day -> "per day"', () => {
    expect(getUnitLabel('per_day')).toBe('per day')
  })
})

describe('getDefaultUnitPrice', () => {
  it('per_person returns extra_person_cents', () => {
    expect(getDefaultUnitPrice(basePricing)).toBe(5000)
  })

  it('flat_rate returns base_price_cents', () => {
    expect(getDefaultUnitPrice({ ...basePricing, pricing_type: 'flat_rate', base_price_cents: 20000 })).toBe(20000)
  })

  it('per_day returns price_per_day_cents', () => {
    expect(getDefaultUnitPrice({ ...basePricing, pricing_type: 'per_day', price_per_day_cents: 4000 })).toBe(4000)
  })
})

describe('formatPrice (dashboard)', () => {
  it('formats whole euros without trailing .00', () => {
    expect(formatPrice(5000)).toBe('50€')
  })

  it('formats cents', () => {
    expect(formatPrice(1299)).toBe('12.99€')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0€')
  })

  it('formats single cent', () => {
    expect(formatPrice(1)).toBe('0.01€')
  })
})

describe('calculateTotalPrice', () => {
  describe('per_person', () => {
    it('multiplies by participants', () => {
      const result = calculateTotalPrice(3, basePricing)
      expect(result.total_cents).toBe(15000)
      expect(result.effective_participants).toBe(3)
    })

    it('enforces min_participants', () => {
      const pricing = { ...basePricing, min_participants: 2 }
      const result = calculateTotalPrice(1, pricing)
      expect(result.effective_participants).toBe(2)
      expect(result.total_cents).toBe(10000)
    })

    it('generates breakdown string', () => {
      const result = calculateTotalPrice(2, basePricing)
      expect(result.breakdown).toContain('×')
      expect(result.breakdown).toContain('2')
    })
  })

  describe('flat_rate', () => {
    const flatPricing: PricingConfig = {
      ...basePricing,
      pricing_type: 'flat_rate',
      base_price_cents: 20000,
    }

    it('constant regardless of participants', () => {
      expect(calculateTotalPrice(1, flatPricing).total_cents).toBe(20000)
      expect(calculateTotalPrice(5, flatPricing).total_cents).toBe(20000)
      expect(calculateTotalPrice(10, flatPricing).total_cents).toBe(20000)
    })
  })

  describe('base_plus_extra', () => {
    const bpePricing: PricingConfig = {
      ...basePricing,
      pricing_type: 'base_plus_extra',
      base_price_cents: 10000,
      included_participants: 2,
      extra_person_cents: 3000,
    }

    it('no extra within included', () => {
      expect(calculateTotalPrice(2, bpePricing).total_cents).toBe(10000)
    })

    it('charges extra beyond included', () => {
      const result = calculateTotalPrice(4, bpePricing)
      expect(result.total_cents).toBe(16000)
    })

    it('breakdown mentions extra', () => {
      const result = calculateTotalPrice(4, bpePricing)
      expect(result.breakdown).toContain('extra')
    })
  })

  describe('per_day', () => {
    const dayPricing: PricingConfig = {
      ...basePricing,
      pricing_type: 'per_day',
      price_per_day_cents: 4000,
      min_days: 1,
      max_days: 7,
    }

    it('calculates days x units', () => {
      const result = calculateTotalPrice(2, dayPricing, null, 3)
      expect(result.total_cents).toBe(24000)
    })

    it('defaults to min_days when no days specified', () => {
      const result = calculateTotalPrice(1, dayPricing)
      expect(result.total_cents).toBe(4000)
    })

    it('enforces min_days', () => {
      const pricing = { ...dayPricing, min_days: 3 }
      const result = calculateTotalPrice(1, pricing, null, 1)
      expect(result.total_cents).toBe(12000)
    })
  })

  describe('session override', () => {
    it('overrides per_person', () => {
      const result = calculateTotalPrice(2, basePricing, 7500)
      expect(result.total_cents).toBe(15000)
    })

    it('overrides flat_rate (constant)', () => {
      const flatPricing: PricingConfig = { ...basePricing, pricing_type: 'flat_rate', base_price_cents: 20000 }
      const result = calculateTotalPrice(5, flatPricing, 15000)
      expect(result.total_cents).toBe(15000)
    })

    it('null override uses regular pricing', () => {
      const result = calculateTotalPrice(2, basePricing, null)
      expect(result.total_cents).toBe(10000)
    })

    it('breakdown mentions session price', () => {
      const result = calculateTotalPrice(2, basePricing, 7500)
      expect(result.breakdown).toContain('session price')
    })
  })
})

describe('getPricingSummary', () => {
  it('per_person summary', () => {
    const result = getPricingSummary(basePricing)
    expect(result).toContain('per person')
  })

  it('per_person with min_participants', () => {
    const pricing = { ...basePricing, min_participants: 3 }
    const result = getPricingSummary(pricing)
    expect(result).toContain('min. 3')
  })

  it('flat_rate summary', () => {
    const result = getPricingSummary({ ...basePricing, pricing_type: 'flat_rate', base_price_cents: 20000, max_participants: 8 })
    expect(result).toContain('8 guests')
  })

  it('base_plus_extra summary', () => {
    const result = getPricingSummary({
      ...basePricing,
      pricing_type: 'base_plus_extra',
      base_price_cents: 10000,
      included_participants: 2,
      extra_person_cents: 3000,
    })
    expect(result).toContain('2 guests')
    expect(result).toContain('extra')
  })
})
