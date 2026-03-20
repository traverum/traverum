import { describe, it, expect } from 'vitest'
import {
  BOOKING_STATUSES,
  PLATFORM_COMMISSION,
  DEFAULT_COMMISSION,
  SELF_OWNED_COMMISSION,
  PAYMENT_DEADLINE_HOURS,
  CURRENCY,
  formatPrice,
  EXPERIENCE_CATEGORIES,
  getCategoryLabel,
  getCategoryIcon,
} from './constants'

describe('Commission constants', () => {
  it('platform commission is 8%', () => {
    expect(PLATFORM_COMMISSION).toBe(8)
  })

  it('default split sums to 100%', () => {
    const { supplier, hotel, platform } = DEFAULT_COMMISSION
    expect(supplier + hotel + platform).toBe(100)
  })

  it('default split is 80/12/8', () => {
    expect(DEFAULT_COMMISSION).toEqual({ supplier: 80, hotel: 12, platform: 8 })
  })

  it('self-owned split sums to 100%', () => {
    const { supplier, hotel, platform } = SELF_OWNED_COMMISSION
    expect(supplier + hotel + platform).toBe(100)
  })

  it('self-owned split is 92/0/8 (no hotel)', () => {
    expect(SELF_OWNED_COMMISSION).toEqual({ supplier: 92, hotel: 0, platform: 8 })
  })

  it('platform rate is consistent across splits', () => {
    expect(DEFAULT_COMMISSION.platform).toBe(PLATFORM_COMMISSION)
    expect(SELF_OWNED_COMMISSION.platform).toBe(PLATFORM_COMMISSION)
  })
})

describe('Currency', () => {
  it('currency is EUR', () => {
    expect(CURRENCY.CODE).toBe('EUR')
    expect(CURRENCY.SYMBOL).toBe('€')
    expect(CURRENCY.DECIMALS).toBe(2)
  })
})

describe('formatPrice (shared)', () => {
  it('formats whole euros', () => {
    expect(formatPrice(5000)).toBe('€50.00')
  })

  it('formats cents correctly', () => {
    expect(formatPrice(1299)).toBe('€12.99')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('€0.00')
  })

  it('formats single cent', () => {
    expect(formatPrice(1)).toBe('€0.01')
  })

  it('formats large amounts', () => {
    expect(formatPrice(999900)).toBe('€9999.00')
  })
})

describe('Booking statuses', () => {
  it('has all required statuses', () => {
    expect(BOOKING_STATUSES.PENDING_SUPPLIER).toBe('pending_supplier')
    expect(BOOKING_STATUSES.CONFIRMED).toBe('confirmed')
    expect(BOOKING_STATUSES.DECLINED).toBe('declined')
    expect(BOOKING_STATUSES.PENDING_PAYMENT).toBe('pending_payment')
    expect(BOOKING_STATUSES.COMPLETED).toBe('completed')
    expect(BOOKING_STATUSES.CANCELLED).toBe('cancelled')
  })
})

describe('Payment deadline', () => {
  it('is 1 hour', () => {
    expect(PAYMENT_DEADLINE_HOURS).toBe(1)
  })
})

describe('Experience categories', () => {
  it('has 6 categories', () => {
    expect(EXPERIENCE_CATEGORIES).toHaveLength(6)
  })

  it('each category has id, label, icon', () => {
    for (const cat of EXPERIENCE_CATEGORIES) {
      expect(cat.id).toBeTruthy()
      expect(cat.label).toBeTruthy()
      expect(cat.icon).toBeTruthy()
    }
  })

  it('getCategoryLabel returns label for known id', () => {
    expect(getCategoryLabel('food')).toBe('Food & Drink')
    expect(getCategoryLabel('nature')).toBe('Nature & Outdoors')
  })

  it('getCategoryLabel returns "All" for null', () => {
    expect(getCategoryLabel(null)).toBe('All')
  })

  it('getCategoryLabel returns raw id for unknown category', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown')
  })

  it('getCategoryIcon returns icon for known id', () => {
    expect(getCategoryIcon('food')).toBeTruthy()
  })

  it('getCategoryIcon returns empty string for null', () => {
    expect(getCategoryIcon(null)).toBe('')
  })
})
