// Availability helper functions for experience scheduling

export interface AvailabilityRule {
  id: string;
  experience_id: string;
  weekdays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  valid_from: string | null; // YYYY-MM-DD or null for year-round
  valid_until: string | null; // YYYY-MM-DD or null for year-round
}

export const WEEKDAYS = [
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
] as const;

export const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // All days
export const DEFAULT_START_TIME = '08:00';
export const DEFAULT_END_TIME = '20:00';

/**
 * Check if a specific date is available based on availability rules
 */
export function isDateAvailable(
  date: Date,
  rules: AvailabilityRule[]
): boolean {
  // No rules = always available (backwards compatible)
  if (rules.length === 0) return true;

  const dayOfWeek = date.getDay();
  const dateStr = formatDateForComparison(date);

  return rules.some((rule) => {
    // Check weekday
    if (!rule.weekdays.includes(dayOfWeek)) return false;

    // Check season (valid_from/valid_until)
    if (rule.valid_from && dateStr < rule.valid_from) return false;
    if (rule.valid_until && dateStr > rule.valid_until) return false;

    return true;
  });
}

/**
 * Check if a specific date and time is available
 */
export function isDateTimeAvailable(
  date: Date,
  time: string, // HH:MM format
  rules: AvailabilityRule[]
): boolean {
  // No rules = always available
  if (rules.length === 0) return true;

  const dayOfWeek = date.getDay();
  const dateStr = formatDateForComparison(date);

  return rules.some((rule) => {
    // Check weekday
    if (!rule.weekdays.includes(dayOfWeek)) return false;

    // Check time window
    if (time < rule.start_time || time > rule.end_time) return false;

    // Check season
    if (rule.valid_from && dateStr < rule.valid_from) return false;
    if (rule.valid_until && dateStr > rule.valid_until) return false;

    return true;
  });
}

/**
 * Get the reason why a date is unavailable
 */
export function getUnavailableReason(
  date: Date,
  rules: AvailabilityRule[]
): string | null {
  if (rules.length === 0) return null;
  if (isDateAvailable(date, rules)) return null;

  const dayOfWeek = date.getDay();
  const dateStr = formatDateForComparison(date);
  const dayName = WEEKDAYS.find((d) => d.value === dayOfWeek)?.fullLabel || '';

  // Check if it's a weekday issue
  const hasWeekdayRule = rules.some((rule) => rule.weekdays.includes(dayOfWeek));
  if (!hasWeekdayRule) {
    return `Not available on ${dayName}s`;
  }

  // Check if it's a season issue
  for (const rule of rules) {
    if (rule.valid_from && dateStr < rule.valid_from) {
      return `Season starts ${formatDisplayDate(rule.valid_from)}`;
    }
    if (rule.valid_until && dateStr > rule.valid_until) {
      return `Season ended ${formatDisplayDate(rule.valid_until)}`;
    }
  }

  return 'Not available';
}

/**
 * Filter dates from an array to only include available ones
 */
export function filterAvailableDates(
  dates: Date[],
  rules: AvailabilityRule[]
): Date[] {
  if (rules.length === 0) return dates;
  return dates.filter((date) => isDateAvailable(date, rules));
}

/**
 * Get operating hours for a specific day
 */
export function getOperatingHours(
  date: Date,
  rules: AvailabilityRule[]
): { start: string; end: string } | null {
  if (rules.length === 0) return null;

  const dayOfWeek = date.getDay();
  const dateStr = formatDateForComparison(date);

  const matchingRule = rules.find((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false;
    if (rule.valid_from && dateStr < rule.valid_from) return false;
    if (rule.valid_until && dateStr > rule.valid_until) return false;
    return true;
  });

  if (!matchingRule) return null;

  return {
    start: matchingRule.start_time,
    end: matchingRule.end_time,
  };
}

// Helper functions
function formatDateForComparison(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Cancellation policy types and helpers
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'non_refundable';

export const CANCELLATION_POLICIES: {
  value: CancellationPolicy;
  label: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Free cancellation up to 24 hours before',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Free cancellation up to 7 days before',
    recommended: true,
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'No refunds after booking is confirmed',
  },
  {
    value: 'non_refundable',
    label: 'Non-refundable',
    description: 'No refunds for guest cancellations',
  },
];

/**
 * Generate the display text for a cancellation policy combination
 */
export function getCancellationPolicyText(
  policy: CancellationPolicy,
  forceMajeureRefund: boolean
): string {
  const policyInfo = CANCELLATION_POLICIES.find((p) => p.value === policy);
  if (!policyInfo) return '';

  let text = policyInfo.description;

  if (forceMajeureRefund) {
    text += '. Full refund if cancelled by supplier due to weather or emergency.';
  }

  return text;
}
