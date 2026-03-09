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

export const CURRENCY = {
  CODE: 'EUR',
  SYMBOL: '€',
  DECIMALS: 2,
} as const;

// Prices are stored in cents
export const formatPrice = (cents: number): string => {
  return `${CURRENCY.SYMBOL}${(cents / 100).toFixed(CURRENCY.DECIMALS)}`;
};

// Experience categories - simplified, traveler-focused
export const EXPERIENCE_CATEGORIES = [
  { id: 'food', label: 'Food & Drink', icon: '🍷' },
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '⛷️' },
  { id: 'wellness', label: 'Wellness & Relaxation', icon: '🧘' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🎭' },
] as const;

export type ExperienceCategory = typeof EXPERIENCE_CATEGORIES[number]['id'];

// Helper to get category label by ID
export const getCategoryLabel = (categoryId: string | null): string => {
  if (!categoryId) return 'All';
  const category = EXPERIENCE_CATEGORIES.find(c => c.id === categoryId);
  return category ? category.label : categoryId;
};

// Helper to get category icon by ID
export const getCategoryIcon = (categoryId: string | null): string => {
  if (!categoryId) return '';
  const category = EXPERIENCE_CATEGORIES.find(c => c.id === categoryId);
  return category ? category.icon : '';
};