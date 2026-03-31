import { describe, it, expect } from 'vitest'
import { calculateCommissionSplit, getDefaultCommissionRates } from './commission'

describe('calculateCommissionSplit', () => {
  const hotelChannel = { commission_supplier: 80, commission_hotel: 12, commission_platform: 8 }
  const directChannel = { commission_supplier: 92, commission_hotel: 0, commission_platform: 8 }

  describe('hotel channel (80/12/8)', () => {
    it('splits 10000 cents correctly', () => {
      const result = calculateCommissionSplit(10000, hotelChannel)
      expect(result.supplierAmount).toBe(8000)
      expect(result.hotelAmount).toBe(1200)
      expect(result.platformAmount).toBe(800)
      expect(result.total).toBe(10000)
    })

    it('sum always equals total', () => {
      const result = calculateCommissionSplit(10000, hotelChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(result.total)
    })

    it('handles zero total', () => {
      const result = calculateCommissionSplit(0, hotelChannel)
      expect(result.supplierAmount).toBe(0)
      expect(result.hotelAmount).toBe(0)
      expect(result.platformAmount).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles small amounts (1 cent)', () => {
      const result = calculateCommissionSplit(1, hotelChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(1)
    })

    it('rounding remainder goes to platform', () => {
      const result = calculateCommissionSplit(999, hotelChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(999)
      expect(result.total).toBe(999)
    })

    it('handles odd amounts where rounding drifts', () => {
      const result = calculateCommissionSplit(333, hotelChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(333)
    })
  })

  describe('direct channel (92/0/8)', () => {
    it('splits correctly with no hotel commission', () => {
      const result = calculateCommissionSplit(10000, directChannel)
      expect(result.supplierAmount).toBe(9200)
      expect(result.hotelAmount).toBe(0)
      expect(result.platformAmount).toBe(800)
      expect(result.total).toBe(10000)
    })

    it('sum always equals total', () => {
      const result = calculateCommissionSplit(10000, directChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(result.total)
    })

    it('handles odd amount', () => {
      const result = calculateCommissionSplit(777, directChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(777)
    })
  })

  describe('edge cases', () => {
    it('100% to supplier', () => {
      const allSupplier = { commission_supplier: 100, commission_hotel: 0, commission_platform: 0 }
      const result = calculateCommissionSplit(5000, allSupplier)
      expect(result.supplierAmount).toBe(5000)
      expect(result.hotelAmount).toBe(0)
      expect(result.platformAmount).toBe(0)
    })

    it('large amount preserves sum', () => {
      const result = calculateCommissionSplit(1_000_000, hotelChannel)
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(1_000_000)
    })

    it('uses Math.round, not Math.floor', () => {
      const result = calculateCommissionSplit(5, hotelChannel)
      expect(result.supplierAmount).toBe(Math.round(5 * 0.8))
      expect(result.hotelAmount).toBe(Math.round(5 * 0.12))
      expect(result.supplierAmount + result.hotelAmount + result.platformAmount).toBe(5)
    })
  })
})

describe('getDefaultCommissionRates', () => {
  it('returns default commission rates', () => {
    const rates = getDefaultCommissionRates()
    expect(rates).toEqual({ supplier: 80, hotel: 12, platform: 8 })
  })

  it('returns a copy (not a reference)', () => {
    const rates = getDefaultCommissionRates()
    ;(rates as any).supplier = 0
    const fresh = getDefaultCommissionRates()
    expect(fresh.supplier).toBe(80)
  })
})
