// Shared constants across apps

export const BOOKING_STATUSES = {
  PENDING_SUPPLIER: 'pending_supplier',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  PENDING_PAYMENT: 'pending_payment',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const REVENUE_SPLIT = {
  SUPPLIER: 0.80,
  DISTRIBUTOR: 0.15,
  PLATFORM: 0.05,
} as const;

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