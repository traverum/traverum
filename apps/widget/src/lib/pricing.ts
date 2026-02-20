import type { Experience, ExperienceSession } from './supabase/types'
import { formatPrice } from './utils'

export interface PriceCalculation {
  basePrice: number
  extraPersonFee: number
  totalPrice: number
  includedParticipants: number
  extraParticipants: number
  pricePerPerson: number | null
  effectiveParticipants: number
}

/**
 * Calculate total price based on experience pricing and participants
 * 
 * Pricing types:
 * - 'per_person': extra_person_cents per participant
 * - 'base_plus_extra': base_price_cents for included_participants, extra_person_cents for additional
 * - 'flat_rate': base_price_cents (constant, regardless of participants)
 * - 'per_day': price_per_day_cents × days × quantity
 * 
 * Session override replaces the unit price and scales with quantity:
 * - per_person / base_plus_extra: override × participants
 * - flat_rate: override (constant)
 * - per_day: override × days × quantity
 * 
 * Note: min_participants is a booking minimum — guests cannot select fewer than this
 * number of participants in the widget. The Math.max below is a safety net.
 */
export function calculatePrice(
  experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants' | 'min_participants' | 'price_per_day_cents' | 'min_days' | 'max_days'>,
  participants: number,
  session?: Pick<ExperienceSession, 'price_override_cents'> | null,
  rentalDays?: number,
  quantity?: number
): PriceCalculation {
  // min_participants is enforced at the UI level (guest can't select fewer), Math.max is a safety net
  const minParticipants = experience.min_participants || 1
  const effectiveParticipants = Math.max(participants, minParticipants)

  // Session override replaces the unit price, scales with quantity
  if (session?.price_override_cents) {
    switch (experience.pricing_type) {
      case 'per_person':
      case 'base_plus_extra': {
        const total = session.price_override_cents * effectiveParticipants
        return {
          basePrice: total,
          extraPersonFee: 0,
          totalPrice: total,
          includedParticipants: effectiveParticipants,
          extraParticipants: 0,
          pricePerPerson: session.price_override_cents,
          effectiveParticipants,
        }
      }
      case 'flat_rate':
        return {
          basePrice: session.price_override_cents,
          extraPersonFee: 0,
          totalPrice: session.price_override_cents,
          includedParticipants: effectiveParticipants,
          extraParticipants: 0,
          pricePerPerson: null,
          effectiveParticipants,
        }
      case 'per_day': {
        const days = rentalDays || experience.min_days || 1
        const qty = quantity || 1
        const total = session.price_override_cents * days * qty
        return {
          basePrice: total,
          extraPersonFee: 0,
          totalPrice: total,
          includedParticipants: qty,
          extraParticipants: 0,
          pricePerPerson: null,
          effectiveParticipants: qty,
        }
      }
      default:
        return {
          basePrice: session.price_override_cents,
          extraPersonFee: 0,
          totalPrice: session.price_override_cents,
          includedParticipants: effectiveParticipants,
          extraParticipants: 0,
          pricePerPerson: null,
          effectiveParticipants,
        }
    }
  }
  
  switch (experience.pricing_type) {
    case 'per_person': {
      const perPersonPrice = experience.extra_person_cents || experience.price_cents
      return {
        basePrice: perPersonPrice * effectiveParticipants,
        extraPersonFee: 0,
        totalPrice: perPersonPrice * effectiveParticipants,
        includedParticipants: effectiveParticipants,
        extraParticipants: 0,
        pricePerPerson: perPersonPrice,
        effectiveParticipants,
      }
    }
    
    case 'base_plus_extra': {
      const extraPeople = Math.max(0, effectiveParticipants - experience.included_participants)
      const extraFee = extraPeople * (experience.extra_person_cents || 0)
      return {
        basePrice: experience.base_price_cents || 0,
        extraPersonFee: extraFee,
        totalPrice: (experience.base_price_cents || 0) + extraFee,
        includedParticipants: experience.included_participants,
        extraParticipants: extraPeople,
        pricePerPerson: null,
        effectiveParticipants,
      }
    }

    case 'per_day': {
      const pricePerDay = experience.price_per_day_cents || experience.extra_person_cents || experience.price_cents
      const days = rentalDays || experience.min_days || 1
      const qty = quantity || 1
      const total = pricePerDay * days * qty
      return {
        basePrice: total,
        extraPersonFee: 0,
        totalPrice: total,
        includedParticipants: qty,
        extraParticipants: 0,
        pricePerPerson: null,
        effectiveParticipants: qty,
      }
    }
    
    case 'flat_rate':
    default:
      return {
        basePrice: experience.base_price_cents || experience.price_cents || 0,
        extraPersonFee: 0,
        totalPrice: experience.base_price_cents || experience.price_cents || 0,
        includedParticipants: effectiveParticipants,
        extraParticipants: 0,
        pricePerPerson: null,
        effectiveParticipants,
      }
  }
}

/**
 * Get price display text for experience card
 */
export function getPriceDisplay(experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'extra_person_cents' | 'base_price_cents' | 'price_per_day_cents' | 'currency'>): {
  amount: number
  suffix: string
} {
  switch (experience.pricing_type) {
    case 'per_person':
      return { amount: experience.extra_person_cents || experience.price_cents, suffix: ' / person' }
    case 'base_plus_extra':
      return { amount: experience.base_price_cents || experience.price_cents, suffix: ' / group' }
    case 'per_day':
      return { amount: experience.price_per_day_cents || experience.extra_person_cents || experience.price_cents, suffix: ' / day' }
    case 'flat_rate':
    default:
      return { amount: experience.base_price_cents || experience.price_cents, suffix: '' }
  }
}

/**
 * Get the display price for booking panels (matching demo format)
 */
export function getDisplayPrice(experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants' | 'price_per_day_cents' | 'currency'>): {
  price: string
  suffix: string
} {
  const currency = experience.currency || 'EUR'

  switch (experience.pricing_type) {
    case 'per_person': {
      const perPersonCents = experience.extra_person_cents || experience.price_cents
      return {
        price: formatPrice(perPersonCents, currency),
        suffix: '/ person',
      }
    }
    case 'base_plus_extra':
      return {
        price: formatPrice(experience.base_price_cents || experience.price_cents, currency),
        suffix: `for ${experience.included_participants}`,
      }
    case 'per_day': {
      const perDayCents = experience.price_per_day_cents || experience.extra_person_cents || experience.price_cents
      return {
        price: formatPrice(perDayCents, currency),
        suffix: '/ day',
      }
    }
    case 'flat_rate':
    default:
      return {
        price: formatPrice(experience.base_price_cents || experience.price_cents, currency),
        suffix: 'total',
      }
  }
}
