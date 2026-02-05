export type PricingType = 'per_person' | 'flat_rate' | 'base_plus_extra' | 'per_day';

export interface PricingConfig {
  pricing_type: PricingType;
  base_price_cents: number;
  included_participants: number;
  extra_person_cents: number;
  min_participants: number;
  max_participants: number;
  min_days?: number;
  max_days?: number;
}

export interface PriceCalculation {
  total_cents: number;
  breakdown: string;
  effective_participants: number;
}

/**
 * Calculate total price for an experience based on pricing type and participants
 * 
 * Pricing types:
 * - per_person: Simple per-head pricing (extra_person_cents × participants)
 * - flat_rate: Fixed price regardless of group size (base_price_cents)
 * - base_plus_extra: Base price includes X people, then extra per additional person
 * - per_day: Time-based pricing for rentals (price_per_day × days × quantity)
 * 
 * Min participants enforces a "price floor" - if fewer book, they pay for minimum
 */
export function calculateTotalPrice(
  participants: number,
  pricing: PricingConfig,
  sessionPriceOverrideCents?: number | null,
  days?: number
): PriceCalculation {
  const { pricing_type, base_price_cents, included_participants, extra_person_cents, min_participants, min_days } = pricing;
  
  // Apply minimum participants (price floor)
  const effective_participants = Math.max(participants, min_participants);
  
  let total_cents: number;
  let breakdown: string;

  // If session has price override, use flat rate for that session
  if (sessionPriceOverrideCents !== undefined && sessionPriceOverrideCents !== null) {
    total_cents = sessionPriceOverrideCents;
    breakdown = `${formatPrice(total_cents)} (special session price)`;
    return { total_cents, breakdown, effective_participants };
  }

  switch (pricing_type) {
    case 'per_person':
      total_cents = extra_person_cents * effective_participants;
      if (participants < min_participants) {
        breakdown = `${formatPrice(extra_person_cents)} × ${min_participants} (minimum) = ${formatPrice(total_cents)}`;
      } else {
        breakdown = `${formatPrice(extra_person_cents)} × ${participants} = ${formatPrice(total_cents)}`;
      }
      break;

    case 'flat_rate':
      total_cents = base_price_cents;
      breakdown = `${formatPrice(total_cents)} (flat rate for up to ${pricing.max_participants} guests)`;
      break;

    case 'base_plus_extra':
      const extraPeople = Math.max(0, effective_participants - included_participants);
      const extraCost = extraPeople * extra_person_cents;
      total_cents = base_price_cents + extraCost;
      
      if (extraPeople > 0) {
        breakdown = `${formatPrice(base_price_cents)} (includes ${included_participants}) + ${formatPrice(extra_person_cents)} × ${extraPeople} extra = ${formatPrice(total_cents)}`;
      } else {
        breakdown = `${formatPrice(base_price_cents)} (includes up to ${included_participants} guests)`;
      }
      break;

    case 'per_day':
      const effectiveDays = days ? Math.max(days, min_days || 1) : (min_days || 1);
      const pricePerDay = extra_person_cents; // For per_day, extra_person_cents stores price per day
      total_cents = pricePerDay * effectiveDays * effective_participants;
      breakdown = `${formatPrice(pricePerDay)}/day × ${effectiveDays} days × ${effective_participants} ${effective_participants === 1 ? 'unit' : 'units'} = ${formatPrice(total_cents)}`;
      break;

    default:
      total_cents = 0;
      breakdown = 'Unknown pricing type';
  }

  return { total_cents, breakdown, effective_participants };
}

/**
 * Format cents to EUR display string
 */
export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.00', '')}€`;
}

/**
 * Get a human-readable pricing summary for display
 */
export function getPricingSummary(pricing: PricingConfig): string {
  const { pricing_type, base_price_cents, included_participants, extra_person_cents, min_participants, max_participants, min_days, max_days } = pricing;

  switch (pricing_type) {
    case 'per_person':
      if (min_participants > 1) {
        return `${formatPrice(extra_person_cents)} per person (min. ${min_participants})`;
      }
      return `${formatPrice(extra_person_cents)} per person`;

    case 'flat_rate':
      return `${formatPrice(base_price_cents)} for up to ${max_participants} guests`;

    case 'base_plus_extra':
      return `${formatPrice(base_price_cents)} for ${included_participants} guests, +${formatPrice(extra_person_cents)} per extra`;

    case 'per_day':
      const daysText = min_days && max_days 
        ? `${min_days}-${max_days} days`
        : min_days 
        ? `min. ${min_days} days`
        : 'per day';
      return `${formatPrice(extra_person_cents)}/day (${daysText})`;

    default:
      return 'Price on request';
  }
}

/**
 * Get example price calculations for preview
 */
export function getPriceExamples(pricing: PricingConfig): { participants: number; price: string }[] {
  const examples: { participants: number; price: string }[] = [];
  const { min_participants, max_participants } = pricing;
  
  // Show min, middle, and max examples
  const points = [
    min_participants,
    Math.ceil((min_participants + max_participants) / 2),
    max_participants
  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  
  for (const p of points) {
    const calc = calculateTotalPrice(p, pricing);
    examples.push({ participants: p, price: formatPrice(calc.total_cents) });
  }
  
  return examples;
}
