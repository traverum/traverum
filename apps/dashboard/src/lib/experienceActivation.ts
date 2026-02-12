import type { PricingType } from '@/lib/pricing';
import type { CancellationPolicy } from '@/lib/availability';

export interface ActivationValidationInput {
  // Basic
  title: string;
  description: string;
  durationMinutes: string;
  maxParticipants: string;
  minParticipants: string;

  // Media
  hasImage: boolean;

  // Pricing
  pricingType: PricingType;
  basePriceCents: string;
  extraPersonCents: string;
  includedParticipants: string;
  minDays: string;

  // Availability (only required when allowsRequests)
  allowsRequests: boolean;
  weekdays: number[];
  startTime: string;
  endTime: string;

  // Policies (cancellation always required, pre-set default)
  cancellationPolicy: CancellationPolicy | string | null;
}

export interface ActivationValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_CANCELLATION_POLICIES: CancellationPolicy[] = [
  'flexible',
  'moderate',
  'strict',
  'non_refundable',
];

/**
 * Validates that an experience has all required fields to go active.
 * - Draft: no validation
 * - Active: basic info, media, pricing, cancellation (always), and availability only when allows_requests
 */
export function validateExperienceForActivation(
  input: ActivationValidationInput
): ActivationValidationResult {
  const errors: string[] = [];

  // Basic info
  if (!input.title?.trim() || input.title.trim().length < 3) {
    errors.push('Title (at least 3 characters)');
  }
  if (!input.description?.trim() || input.description.trim().length < 50) {
    errors.push('Description (at least 50 characters)');
  }
  const duration = parseInt(input.durationMinutes, 10);
  if (!input.durationMinutes || isNaN(duration) || duration <= 0) {
    errors.push('Duration (must be greater than 0)');
  }
  const maxP = parseInt(input.maxParticipants, 10);
  if (!input.maxParticipants || isNaN(maxP) || maxP < 1) {
    errors.push('Max participants (at least 1)');
  }
  const minP = parseInt(input.minParticipants, 10);
  if (minP > maxP) {
    errors.push('Min participants must not exceed max participants');
  }

  // Media
  if (!input.hasImage) {
    errors.push('At least one image');
  }

  // Pricing
  const baseP = Math.round((parseFloat(input.basePriceCents) || 0) * 100);
  const extraP = Math.round((parseFloat(input.extraPersonCents) || 0) * 100);
  const inclP = parseInt(input.includedParticipants, 10) || 0;
  const minD = parseInt(input.minDays, 10) || 0;

  if (input.pricingType === 'per_person') {
    if (extraP < 100) errors.push('Valid price (at least €1 per person)');
  } else if (input.pricingType === 'flat_rate') {
    if (baseP < 100) errors.push('Valid price (at least €1 total)');
  } else if (input.pricingType === 'base_plus_extra') {
    if (baseP < 100 || inclP < 1)
      errors.push('Valid base price and included participants');
  } else if (input.pricingType === 'per_day') {
    if (extraP < 100 || minD < 1)
      errors.push('Valid price per day and minimum days');
  }

  // Cancellation policy (always required, pre-set to moderate by default)
  if (
    !input.cancellationPolicy ||
    !VALID_CANCELLATION_POLICIES.includes(input.cancellationPolicy as CancellationPolicy)
  ) {
    errors.push('Cancellation policy');
  }

  // Availability: required only when allows_requests
  if (input.allowsRequests) {
    if (!input.weekdays?.length || input.weekdays.length === 0) {
      errors.push(
        'Operating days (select at least one day when “Allow requests” is on)'
      );
    } else if (!input.startTime || !input.endTime) {
      errors.push('Operating hours (start and end time)');
    } else if (input.startTime >= input.endTime) {
      errors.push('Operating hours (end time must be after start time)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
