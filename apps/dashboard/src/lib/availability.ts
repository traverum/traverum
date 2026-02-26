// Availability helper functions for experience scheduling

import { format } from 'date-fns';

export interface AvailabilityRule {
  id: string;
  experience_id: string;
  weekdays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  valid_from: string | null; // MM-DD format (recurring yearly) or null for year-round
  valid_until: string | null; // MM-DD format (recurring yearly) or null for year-round
}

export const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

export function getDaysForMonth(month: string): string[] {
  const m = parseInt(month);
  let maxDay = 31;
  if (m === 2) maxDay = 29;
  else if ([4, 6, 9, 11].includes(m)) maxDay = 30;
  if (!m) maxDay = 31;
  return Array.from({ length: maxDay }, (_, i) =>
    (i + 1).toString().padStart(2, '0')
  );
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
 * Check if a MM-DD string falls within a recurring season.
 * Handles wrap-around seasons (e.g. 11-01 to 03-31 = winter season).
 */
function isInSeason(mmdd: string, from: string | null, until: string | null): boolean {
  if (!from && !until) return true;
  if (from && !until) return mmdd >= from;
  if (!from && until) return mmdd <= until;

  if (from! <= until!) {
    return mmdd >= from! && mmdd <= until!;
  }
  // Wrap-around (e.g. Nov–Mar)
  return mmdd >= from! || mmdd <= until!;
}

/**
 * Check if a specific date is available based on availability rules
 */
export function isDateAvailable(
  date: Date,
  rules: AvailabilityRule[]
): boolean {
  if (rules.length === 0) return true;

  const dayOfWeek = date.getDay();
  const mmdd = formatMonthDay(date);

  return rules.some((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false;
    return isInSeason(mmdd, rule.valid_from, rule.valid_until);
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
  if (rules.length === 0) return true;

  const dayOfWeek = date.getDay();
  const mmdd = formatMonthDay(date);

  return rules.some((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false;
    if (time < rule.start_time || time > rule.end_time) return false;
    return isInSeason(mmdd, rule.valid_from, rule.valid_until);
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
  const mmdd = formatMonthDay(date);
  const dayName = WEEKDAYS.find((d) => d.value === dayOfWeek)?.fullLabel || '';

  const hasWeekdayRule = rules.some((rule) => rule.weekdays.includes(dayOfWeek));
  if (!hasWeekdayRule) {
    return `Not available on ${dayName}s`;
  }

  for (const rule of rules) {
    if (!isInSeason(mmdd, rule.valid_from, rule.valid_until)) {
      if (rule.valid_from && rule.valid_until) {
        return `Only available ${formatSeasonDisplay(rule.valid_from)} – ${formatSeasonDisplay(rule.valid_until)}`;
      }
      if (rule.valid_from) {
        return `Season starts ${formatSeasonDisplay(rule.valid_from)}`;
      }
      if (rule.valid_until) {
        return `Season ends ${formatSeasonDisplay(rule.valid_until)}`;
      }
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
  const mmdd = formatMonthDay(date);

  const matchingRule = rules.find((rule) => {
    if (!rule.weekdays.includes(dayOfWeek)) return false;
    return isInSeason(mmdd, rule.valid_from, rule.valid_until);
  });

  if (!matchingRule) return null;

  return {
    start: matchingRule.start_time,
    end: matchingRule.end_time,
  };
}

function formatMonthDay(date: Date): string {
  return format(date, 'MM-dd');
}

/** Format MM-DD as "1 April" for display */
function formatSeasonDisplay(mmdd: string): string {
  const [m, d] = mmdd.split('-');
  const monthName = MONTHS.find((month) => month.value === m)?.label || m;
  return `${parseInt(d)} ${monthName}`;
}

// Cancellation policy types and helpers
export type CancellationPolicy = 'flexible' | 'moderate';

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
];

/**
 * Generate the display text for a cancellation policy.
 * Weather/emergency refund is always included (industry standard).
 */
export function getCancellationPolicyText(
  policy: CancellationPolicy
): string {
  const policyInfo = CANCELLATION_POLICIES.find((p) => p.value === policy);
  if (!policyInfo) return '';

  return `${policyInfo.description}. Full refund if cancelled by provider due to weather or emergency.`;
}
