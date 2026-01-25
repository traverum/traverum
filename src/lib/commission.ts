import type { Distribution } from './supabase/types'

export interface CommissionSplit {
  supplierAmount: number
  hotelAmount: number
  platformAmount: number
  total: number
}

/**
 * Calculate commission split based on distribution rates
 * Default: Supplier 80%, Hotel 12%, Platform 8%
 */
export function calculateCommissionSplit(
  totalCents: number,
  distribution: Pick<Distribution, 'commission_supplier' | 'commission_hotel' | 'commission_platform'>
): CommissionSplit {
  // Commission rates are stored as percentages (e.g., 80 for 80%)
  const supplierRate = distribution.commission_supplier / 100
  const hotelRate = distribution.commission_hotel / 100
  const platformRate = distribution.commission_platform / 100
  
  // Calculate amounts
  const supplierAmount = Math.round(totalCents * supplierRate)
  const hotelAmount = Math.round(totalCents * hotelRate)
  const platformAmount = Math.round(totalCents * platformRate)
  
  // Handle rounding - give any remainder to platform
  const calculatedTotal = supplierAmount + hotelAmount + platformAmount
  const adjustment = totalCents - calculatedTotal
  
  return {
    supplierAmount,
    hotelAmount,
    platformAmount: platformAmount + adjustment,
    total: totalCents,
  }
}

/**
 * Get default commission rates
 */
export function getDefaultCommissionRates() {
  return {
    supplier: 80,
    hotel: 12,
    platform: 8,
  }
}
