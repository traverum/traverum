import { DEFAULT_COMMISSION, SELF_OWNED_COMMISSION } from '@traverum/shared'

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateRequiredFields(input: {
  hotelSlug?: string | null
  experienceId?: string | null
  participants?: number | null
  totalCents?: number | null
  guestName?: string | null
  guestEmail?: string | null
  isDirect: boolean
}): ValidationResult {
  const { hotelSlug, experienceId, participants, totalCents, guestName, guestEmail, isDirect } = input

  if ((!hotelSlug && !isDirect) || !experienceId || !participants || !totalCents || !guestName || !guestEmail) {
    return { valid: false, error: 'Missing required fields' }
  }

  return { valid: true }
}

export function validateParticipants(
  participants: number,
  maxParticipants: number,
  isRental: boolean
): ValidationResult {
  if (isRental) return { valid: true }

  if (participants < 1 || participants > maxParticipants) {
    return { valid: false, error: `Participants must be between 1 and ${maxParticipants}` }
  }

  return { valid: true }
}

export function validateRentalRequest(input: {
  requestDate?: string | null
  rentalDays: number
  minDays: number
  maxDays: number | null
}): ValidationResult {
  const { requestDate, rentalDays, minDays, maxDays } = input

  if (!requestDate) {
    return { valid: false, error: 'Rental start date is required' }
  }
  if (rentalDays < 1) {
    return { valid: false, error: 'Number of rental days is required' }
  }
  if (rentalDays < minDays) {
    return { valid: false, error: `Minimum rental period is ${minDays} days` }
  }
  if (maxDays && rentalDays > maxDays) {
    return { valid: false, error: `Maximum rental period is ${maxDays} days` }
  }

  return { valid: true }
}

export function validatePriceMatch(totalCents: number, expectedTotal: number): ValidationResult {
  if (Math.abs(totalCents - expectedTotal) > 1) {
    return { valid: false, error: 'Price mismatch. Please refresh and try again.' }
  }

  return { valid: true }
}

/**
 * Compute the inclusive end date for a rental.
 * E.g. start 2026-03-20, 3 days → 2026-03-22 (days 20, 21, 22).
 */
export function computeRentalEndDate(startDate: string, rentalDays: number): string {
  const d = new Date(startDate + 'T12:00:00')
  d.setDate(d.getDate() + rentalDays - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Normalize HH:MM to HH:MM:SS for database storage.
 */
export function normalizeRequestTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time
}

/**
 * Determine which commission rates apply for an auto-created distribution
 * (receptionist bookings that don't have an existing distribution).
 */
export function resolveAutoDistributionRates(isSelfOwned: boolean): {
  commission_supplier: number
  commission_hotel: number
  commission_platform: number
} {
  if (isSelfOwned) {
    return {
      commission_supplier: SELF_OWNED_COMMISSION.supplier,
      commission_hotel: SELF_OWNED_COMMISSION.hotel,
      commission_platform: SELF_OWNED_COMMISSION.platform,
    }
  }
  return {
    commission_supplier: DEFAULT_COMMISSION.supplier,
    commission_hotel: DEFAULT_COMMISSION.hotel,
    commission_platform: DEFAULT_COMMISSION.platform,
  }
}
