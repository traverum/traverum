import type { Experience, ExperienceSession } from './supabase/types'

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
 * - 'per_person': extra_person_cents per participant (enforces min_participants)
 * - 'base_plus_extra': base_price_cents for included_participants, extra_person_cents for additional
 * - 'flat_rate': base_price_cents (constant, regardless of participants)
 */
export function calculatePrice(
  experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants' | 'min_participants'>,
  participants: number,
  session?: Pick<ExperienceSession, 'price_override_cents'> | null
): PriceCalculation {
  // Session override takes precedence
  if (session?.price_override_cents) {
    return {
      basePrice: session.price_override_cents,
      extraPersonFee: 0,
      totalPrice: session.price_override_cents,
      includedParticipants: participants,
      extraParticipants: 0,
      pricePerPerson: null,
      effectiveParticipants: participants,
    }
  }

  // Enforce minimum participants
  const effectiveParticipants = Math.max(participants, experience.min_participants || 1)
  
  switch (experience.pricing_type) {
    case 'per_person':
      // Use extra_person_cents (not price_cents)
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
    
    case 'base_plus_extra':
      // Base price for included participants, extra for additional
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
    
    case 'flat_rate':
    default:
      // Fixed price regardless of participants
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
export function getPriceDisplay(experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'extra_person_cents' | 'base_price_cents' | 'currency'>): {
  amount: number
  suffix: string
} {
  switch (experience.pricing_type) {
    case 'per_person':
      return { amount: experience.extra_person_cents || experience.price_cents, suffix: ' / person' }
    case 'base_plus_extra':
      return { amount: experience.base_price_cents || experience.price_cents, suffix: ' / group' }
    case 'flat_rate':
    default:
      return { amount: experience.base_price_cents || experience.price_cents, suffix: '' }
  }
}

/**
 * Get the display price for booking panels (matching demo format)
 */
export function getDisplayPrice(experience: Pick<Experience, 'pricing_type' | 'price_cents' | 'base_price_cents' | 'extra_person_cents' | 'included_participants'>): {
  price: string
  suffix: string
} {
  switch (experience.pricing_type) {
    case 'per_person':
      const perPersonCents = experience.extra_person_cents || experience.price_cents
      return {
        price: (perPersonCents / 100).toFixed(0),
        suffix: '/ person',
      }
    case 'base_plus_extra':
      return {
        price: ((experience.base_price_cents || experience.price_cents) / 100).toFixed(0),
        suffix: `for ${experience.included_participants}`,
      }
    case 'flat_rate':
    default:
      return {
        price: ((experience.base_price_cents || experience.price_cents) / 100).toFixed(0),
        suffix: 'total',
      }
  }
}