// Shared constants across apps

export const BOOKING_STATUSES = {
  PENDING_SUPPLIER: 'pending_supplier',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  PENDING_PAYMENT: 'pending_payment',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Commission rates (percentages). Platform rate is the only true constant.
// Default and self-owned splits are the single source of truth for all apps.
export const PLATFORM_COMMISSION = 8 as const;

export const DEFAULT_COMMISSION = {
  supplier: 80,
  hotel: 12,
  platform: PLATFORM_COMMISSION,
} as const;

export const SELF_OWNED_COMMISSION = {
  supplier: 92,
  hotel: 0,
  platform: PLATFORM_COMMISSION,
} as const;

/** Hours the guest has to complete payment after approval (payment link validity). */
export const PAYMENT_DEADLINE_HOURS = 1 as const;

export const PAYMENT_MODES = {
  STRIPE: 'stripe',
  PAY_ON_SITE: 'pay_on_site',
} as const;

export type PaymentMode = typeof PAYMENT_MODES[keyof typeof PAYMENT_MODES];

export const ATTENDANCE_VERIFICATION_DAYS = 3;
export const ATTENDANCE_REMINDER_DAY = 2;

export const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];

export const CURRENCY = {
  CODE: 'EUR',
  SYMBOL: '€',
  DECIMALS: 2,
} as const;

// Prices are stored in cents
export const formatPrice = (cents: number): string => {
  return `${CURRENCY.SYMBOL}${(cents / 100).toFixed(CURRENCY.DECIMALS)}`;
};

// Experience tags — curated editorial labels. One experience can have many.
export const EXPERIENCE_TAGS = [
  { id: 'unusual', label: 'Unusual Experiences' },
  { id: 'classic', label: 'Classic Experiences' },
  { id: 'family', label: 'Family Time' },
  { id: 'adventure_outdoors', label: 'Adventure & Outdoors' },
  { id: 'local_life', label: 'Local Life' },
  { id: 'history', label: 'History Beyond the Relax' },
  { id: 'food_wine', label: 'Food & Wine' },
] as const;

export type ExperienceTag = typeof EXPERIENCE_TAGS[number]['id'];

const LEGACY_TAG_MAP: Record<string, ExperienceTag> = {
  food: 'food_wine',
  culture: 'history',
  nature: 'adventure_outdoors',
  adventure: 'adventure_outdoors',
  wellness: 'classic',
  nightlife: 'local_life',
};

/**
 * Map old category slugs to current tag IDs and deduplicate.
 * Safe to call on already-migrated arrays — returns them unchanged.
 */
export const migrateLegacyTags = (tags: string[]): string[] => {
  const mapped = tags.map(t => LEGACY_TAG_MAP[t] ?? t);
  return Array.from(new Set(mapped));
};

export const getTagLabel = (tagId: string | null): string => {
  if (!tagId) return 'All';
  const tag = EXPERIENCE_TAGS.find(t => t.id === tagId);
  return tag ? tag.label : tagId;
};

export const getTagLabels = (tags: string[]): string[] =>
  tags.map(getTagLabel);

/** @deprecated Use EXPERIENCE_TAGS / getTagLabel instead */
export const EXPERIENCE_CATEGORIES = EXPERIENCE_TAGS;
/** @deprecated Use getTagLabel instead */
export const getCategoryLabel = getTagLabel;
/** @deprecated Removed — tags no longer have icons */
export const getCategoryIcon = (_tagId: string | null): string => '';