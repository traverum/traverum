import { describe, it, expect } from 'vitest'
import { calculatePrice, getPriceDisplay, getDisplayPrice } from './pricing'

const baseExperience = {
  pricing_type: 'per_person' as const,
  price_cents: 5000,
  base_price_cents: 0,
  extra_person_cents: 5000,
  included_participants: 1,
  min_participants: 1,
  price_per_day_cents: 0,
  min_days: null as number | null,
  max_days: null as number | null,
}

describe('calculatePrice', () => {
  describe('per_person pricing', () => {
    it('multiplies price by participants', () => {
      const result = calculatePrice(baseExperience, 3)
      expect(result.totalPrice).toBe(15000)
      expect(result.pricePerPerson).toBe(5000)
      expect(result.effectiveParticipants).toBe(3)
    })

    it('enforces min_participants', () => {
      const exp = { ...baseExperience, min_participants: 2 }
      const result = calculatePrice(exp, 1)
      expect(result.effectiveParticipants).toBe(2)
      expect(result.totalPrice).toBe(10000)
    })

    it('single participant', () => {
      const result = calculatePrice(baseExperience, 1)
      expect(result.totalPrice).toBe(5000)
    })
  })

  describe('flat_rate pricing', () => {
    const flatRate = {
      ...baseExperience,
      pricing_type: 'flat_rate' as const,
      base_price_cents: 20000,
      price_cents: 20000,
    }

    it('price is constant regardless of participants', () => {
      expect(calculatePrice(flatRate, 1).totalPrice).toBe(20000)
      expect(calculatePrice(flatRate, 5).totalPrice).toBe(20000)
      expect(calculatePrice(flatRate, 10).totalPrice).toBe(20000)
    })

    it('pricePerPerson is null', () => {
      expect(calculatePrice(flatRate, 3).pricePerPerson).toBeNull()
    })
  })

  describe('base_plus_extra pricing', () => {
    const basePlusExtra = {
      ...baseExperience,
      pricing_type: 'base_plus_extra' as const,
      base_price_cents: 10000,
      extra_person_cents: 3000,
      included_participants: 2,
    }

    it('no extra fee within included participants', () => {
      const result = calculatePrice(basePlusExtra, 2)
      expect(result.totalPrice).toBe(10000)
      expect(result.extraParticipants).toBe(0)
      expect(result.extraPersonFee).toBe(0)
    })

    it('charges extra for additional participants', () => {
      const result = calculatePrice(basePlusExtra, 4)
      expect(result.extraParticipants).toBe(2)
      expect(result.extraPersonFee).toBe(6000)
      expect(result.totalPrice).toBe(16000)
    })

    it('single participant within included', () => {
      const result = calculatePrice(basePlusExtra, 1)
      expect(result.totalPrice).toBe(10000)
      expect(result.extraParticipants).toBe(0)
    })
  })

  describe('per_day pricing', () => {
    const perDay = {
      ...baseExperience,
      pricing_type: 'per_day' as const,
      price_per_day_cents: 4000,
      min_days: 1,
      max_days: 7,
    }

    it('calculates days x quantity', () => {
      const result = calculatePrice(perDay, 1, null, 3, 2)
      expect(result.totalPrice).toBe(24000)
    })

    it('defaults to min_days when no rentalDays provided', () => {
      const result = calculatePrice(perDay, 1, null, undefined, 1)
      expect(result.totalPrice).toBe(4000)
    })

    it('defaults quantity to 1', () => {
      const result = calculatePrice(perDay, 1, null, 5)
      expect(result.totalPrice).toBe(20000)
    })
  })

  describe('session price override', () => {
    it('overrides per_person pricing', () => {
      const session = { price_override_cents: 7500 }
      const result = calculatePrice(baseExperience, 2, session)
      expect(result.totalPrice).toBe(15000)
      expect(result.pricePerPerson).toBe(7500)
    })

    it('overrides flat_rate pricing', () => {
      const flatRate = { ...baseExperience, pricing_type: 'flat_rate' as const, base_price_cents: 20000 }
      const session = { price_override_cents: 15000 }
      const result = calculatePrice(flatRate, 5, session)
      expect(result.totalPrice).toBe(15000)
    })

    it('overrides per_day pricing', () => {
      const perDay = { ...baseExperience, pricing_type: 'per_day' as const, price_per_day_cents: 4000, min_days: 1 }
      const session = { price_override_cents: 5000 }
      const result = calculatePrice(perDay, 1, session, 3, 2)
      expect(result.totalPrice).toBe(30000)
    })

    it('null override uses regular pricing', () => {
      const session = { price_override_cents: null as number | null }
      const result = calculatePrice(baseExperience, 2, session)
      expect(result.totalPrice).toBe(10000)
    })
  })
})

describe('getPriceDisplay', () => {
  it('per_person shows per person suffix', () => {
    const result = getPriceDisplay({
      pricing_type: 'per_person',
      price_cents: 5000,
      extra_person_cents: 5000,
      base_price_cents: 0,
      price_per_day_cents: 0,
      currency: 'EUR',
    })
    expect(result.amount).toBe(5000)
    expect(result.suffix).toBe(' / person')
  })

  it('flat_rate shows no suffix', () => {
    const result = getPriceDisplay({
      pricing_type: 'flat_rate',
      price_cents: 20000,
      extra_person_cents: 0,
      base_price_cents: 20000,
      price_per_day_cents: 0,
      currency: 'EUR',
    })
    expect(result.amount).toBe(20000)
    expect(result.suffix).toBe('')
  })

  it('per_day shows per day suffix', () => {
    const result = getPriceDisplay({
      pricing_type: 'per_day',
      price_cents: 0,
      extra_person_cents: 0,
      base_price_cents: 0,
      price_per_day_cents: 4000,
      currency: 'EUR',
    })
    expect(result.amount).toBe(4000)
    expect(result.suffix).toBe(' / day')
  })

  it('base_plus_extra shows group suffix', () => {
    const result = getPriceDisplay({
      pricing_type: 'base_plus_extra',
      price_cents: 0,
      extra_person_cents: 3000,
      base_price_cents: 10000,
      price_per_day_cents: 0,
      currency: 'EUR',
    })
    expect(result.amount).toBe(10000)
    expect(result.suffix).toBe(' / group')
  })
})

describe('getDisplayPrice', () => {
  it('per_person includes formatted price and suffix', () => {
    const result = getDisplayPrice({
      pricing_type: 'per_person',
      price_cents: 5000,
      base_price_cents: 0,
      extra_person_cents: 5000,
      included_participants: 1,
      price_per_day_cents: 0,
      currency: 'EUR',
    })
    expect(result.price).toContain('50')
    expect(result.suffix).toBe('/ person')
  })

  it('flat_rate shows total suffix', () => {
    const result = getDisplayPrice({
      pricing_type: 'flat_rate',
      price_cents: 20000,
      base_price_cents: 20000,
      extra_person_cents: 0,
      included_participants: 1,
      price_per_day_cents: 0,
      currency: 'EUR',
    })
    expect(result.suffix).toBe('total')
  })
})
