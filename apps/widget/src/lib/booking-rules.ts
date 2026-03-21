import { SELF_OWNED_COMMISSION } from '@traverum/shared'
import type { CommissionSplit } from './commission'

/**
 * Resolve which commission rates to use for a booking.
 * Direct bookings always use SELF_OWNED rates (92/0/8).
 * Hotel bookings use the distribution row from the database.
 */
export function resolveCommissionRates(params: {
  isDirect: boolean
  distribution?: {
    commission_supplier: number
    commission_hotel: number
    commission_platform: number
  } | null
}): {
  rates: { commission_supplier: number; commission_hotel: number; commission_platform: number } | null
  error?: string
} {
  const { isDirect, distribution } = params

  if (isDirect) {
    return {
      rates: {
        commission_supplier: SELF_OWNED_COMMISSION.supplier,
        commission_hotel: SELF_OWNED_COMMISSION.hotel,
        commission_platform: SELF_OWNED_COMMISSION.platform,
      },
    }
  }

  if (!distribution) {
    return { rates: null, error: 'Distribution not found for hotel booking' }
  }

  return { rates: distribution }
}

/**
 * Resolve the canonical experience date from the various possible sources.
 * Priority: rental start date > session date > requested date.
 */
export function resolveExperienceDate(params: {
  isRental: boolean
  rentalStartDate?: string | null
  sessionDate?: string | null
  requestedDate?: string | null
}): string {
  const { isRental, rentalStartDate, sessionDate, requestedDate } = params

  if (isRental && rentalStartDate) return rentalStartDate
  return sessionDate || requestedDate || ''
}

/**
 * Compute rental duration from inclusive start/end dates.
 * rental_end_date is inclusive (last day). Duration = diff + 1.
 * Returns undefined if either date is missing.
 */
export function computeRentalDaysFromDates(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number | undefined {
  if (!startDate || !endDate) return undefined

  const start = new Date(startDate + 'T12:00:00').getTime()
  const end = new Date(endDate + 'T12:00:00').getTime()
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

/**
 * Build the booking record to insert into the database.
 * Pure data transformation — no I/O.
 */
export function buildBookingRecord(params: {
  reservationId: string
  sessionId?: string | null
  totalCents: number
  split: CommissionSplit
  paymentIntentId: string
  chargeId: string
}): {
  reservation_id: string
  session_id: string | null
  amount_cents: number
  supplier_amount_cents: number
  hotel_amount_cents: number
  platform_amount_cents: number
  stripe_payment_intent_id: string
  stripe_charge_id: string
  booking_status: 'confirmed'
  paid_at: string
} {
  return {
    reservation_id: params.reservationId,
    session_id: params.sessionId || null,
    amount_cents: params.totalCents,
    supplier_amount_cents: params.split.supplierAmount,
    hotel_amount_cents: params.split.hotelAmount,
    platform_amount_cents: params.split.platformAmount,
    stripe_payment_intent_id: params.paymentIntentId,
    stripe_charge_id: params.chargeId,
    booking_status: 'confirmed',
    paid_at: new Date().toISOString(),
  }
}

/**
 * Verify the commission split invariant: all parts must sum to the total.
 */
export function verifyCommissionSplitIntegrity(split: CommissionSplit): boolean {
  return split.supplierAmount + split.hotelAmount + split.platformAmount === split.total
}
