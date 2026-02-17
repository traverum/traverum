export type PricingType = 'per_person' | 'flat_rate' | 'base_plus_extra' | 'per_day';

export interface PricingConfig {
  pricing_type: PricingType;
  base_price_cents: number;
  included_participants: number;
  extra_person_cents: number;
  price_per_day_cents: number;
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
 * Get the unit price label for a pricing type (used in session override UI)
 */
export function getUnitLabel(pricingType: PricingType): string {
  switch (pricingType) {
    case 'per_person':
    case 'base_plus_extra':
      return 'per person';
    case 'flat_rate':
      return 'total';
    case 'per_day':
      return 'per day';
    default:
      return 'per person';
  }
}

/**
 * Get the default unit price for a pricing type (used as placeholder in session override)
 */
export function getDefaultUnitPrice(pricing: PricingConfig): number {
  switch (pricing.pricing_type) {
    case 'per_person':
      return pricing.extra_person_cents;
    case 'flat_rate':
      return pricing.base_price_cents;
    case 'base_plus_extra':
      return pricing.base_price_cents;
    case 'per_day':
      return pricing.price_per_day_cents;
    default:
      return 0;
  }
}

/**
 * Calculate total price for an experience based on pricing type and participants
 * 
 * Pricing types:
 * - per_person: Simple per-head pricing (extra_person_cents × participants)
 * - flat_rate: Fixed price regardless of group size (base_price_cents)
 * - base_plus_extra: Base price includes X people, then extra per additional person
 * - per_day: Time-based pricing for rentals (price_per_day_cents × days × quantity)
 * 
 * Session override replaces the unit price and scales with quantity:
 * - per_person / base_plus_extra: override × participants
 * - flat_rate: override (constant)
 * - per_day: override × days × quantity
 * 
 * Note: min_participants is a booking minimum — guests cannot select fewer than this
 * number of participants in the widget. The Math.max below is a safety net.
 */
export function calculateTotalPrice(
  participants: number,
  pricing: PricingConfig,
  sessionPriceOverrideCents?: number | null,
  days?: number
): PriceCalculation {
  const { pricing_type, base_price_cents, included_participants, extra_person_cents, price_per_day_cents, min_participants, min_days } = pricing;
  
  // min_participants is enforced at the UI level (guest can't select fewer), Math.max is a safety net
  const effective_participants = Math.max(participants, min_participants || 1);
  
  let total_cents: number;
  let breakdown: string;

  // Session override replaces the unit price, scales with quantity
  if (sessionPriceOverrideCents !== undefined && sessionPriceOverrideCents !== null) {
    switch (pricing_type) {
      case 'per_person':
      case 'base_plus_extra':
        total_cents = sessionPriceOverrideCents * effective_participants;
        breakdown = `${formatPrice(sessionPriceOverrideCents)} × ${effective_participants} = ${formatPrice(total_cents)} (session price)`;
        break;
      case 'flat_rate':
        total_cents = sessionPriceOverrideCents;
        breakdown = `${formatPrice(total_cents)} (session price)`;
        break;
      case 'per_day': {
        const effectiveDays = days ? Math.max(days, min_days || 1) : (min_days || 1);
        total_cents = sessionPriceOverrideCents * effectiveDays * effective_participants;
        breakdown = `${formatPrice(sessionPriceOverrideCents)}/day × ${effectiveDays} days × ${effective_participants} ${effective_participants === 1 ? 'unit' : 'units'} = ${formatPrice(total_cents)} (session price)`;
        break;
      }
      default:
        total_cents = sessionPriceOverrideCents;
        breakdown = `${formatPrice(total_cents)} (session price)`;
    }
    return { total_cents, breakdown, effective_participants };
  }

  switch (pricing_type) {
    case 'per_person':
      total_cents = extra_person_cents * effective_participants;
      breakdown = `${formatPrice(extra_person_cents)} × ${effective_participants} = ${formatPrice(total_cents)}`;
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

    case 'per_day': {
      const effectiveDays = days ? Math.max(days, min_days || 1) : (min_days || 1);
      total_cents = price_per_day_cents * effectiveDays * effective_participants;
      breakdown = `${formatPrice(price_per_day_cents)}/day × ${effectiveDays} days × ${effective_participants} ${effective_participants === 1 ? 'unit' : 'units'} = ${formatPrice(total_cents)}`;
      break;
    }

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
  const { pricing_type, base_price_cents, included_participants, extra_person_cents, price_per_day_cents, min_participants, max_participants, min_days, max_days } = pricing;

  switch (pricing_type) {
    case 'per_person':
      if (min_participants > 1) {
        return `${formatPrice(extra_person_cents)} per person (min. ${min_participants} guests)`;
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
      return `${formatPrice(price_per_day_cents)}/day (${daysText})`;

    default:
      return 'Price on request';
  }
}

/**
 * Get example price calculations for preview
 */
export function getPriceExamples(pricing: PricingConfig): { participants: number; price: string; label?: string }[] {
  const { pricing_type, min_participants, max_participants, min_days, max_days } = pricing;

  // For per_day, show day-based examples instead of participant-based
  if (pricing_type === 'per_day') {
    const minD = min_days || 1;
    const maxD = max_days || 7;
    const midD = Math.ceil((minD + maxD) / 2);
    const dayPoints = [minD, midD, maxD].filter((v, i, a) => a.indexOf(v) === i);
    
    return dayPoints.map(d => {
      const calc = calculateTotalPrice(1, pricing, null, d);
      return { participants: d, price: formatPrice(calc.total_cents), label: `${d} ${d === 1 ? 'day' : 'days'}` };
    });
  }

  const examples: { participants: number; price: string }[] = [];
  
  // Show min, middle, and max examples
  const points = [
    Math.max(1, min_participants || 1),
    Math.ceil((1 + max_participants) / 2),
    max_participants
  ].filter((v, i, a) => a.indexOf(v) === i);
  
  for (const p of points) {
    const calc = calculateTotalPrice(p, pricing);
    examples.push({ participants: p, price: formatPrice(calc.total_cents) });
  }
  
  return examples;
}
