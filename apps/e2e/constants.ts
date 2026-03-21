/**
 * E2E test constants — mirrors UUIDs and values from the seed data
 * in apps/dashboard/supabase/seed.sql.
 *
 * If you change the seed, update these to match.
 */

/** Dedicated port so Playwright never collides with a normal `next dev` on 3000. */
export const WIDGET_E2E_PORT = 3110
export const WIDGET_E2E_BASE_URL = `http://localhost:${WIDGET_E2E_PORT}`

// Partners
export const HOTEL_PARTNER_ID = '11111111-1111-1111-1111-111111111101'
export const SUPPLIER_PARTNER_ID = '11111111-1111-1111-1111-111111111102'

// Hotel config
export const HOTEL_CONFIG_ID = '22222222-2222-2222-2222-222222222201'
export const HOTEL_SLUG = 'test-hotel'
export const HOTEL_DISPLAY_NAME = 'Test Hotel'

// Primary test experience (Lake Tour — has distribution, session, media)
export const EXPERIENCE_ID = '33333333-3333-3333-3333-333333333301'
export const EXPERIENCE_TITLE = 'Lake Tour'
export const EXPERIENCE_SLUG = 'lake-tour'
export const EXPERIENCE_PRICE_CENTS = 5000
export const EXPERIENCE_CURRENCY = 'EUR'
export const EXPERIENCE_MAX_PARTICIPANTS = 10

// Session for the primary experience
export const SESSION_ID = '44444444-4444-4444-4444-444444444401'

// Distribution (hotel ↔ experience link)
export const DISTRIBUTION_ID = '55555555-5555-5555-5555-555555555501'

// Test guest data (identifiable for cleanup)
export const TEST_GUEST_NAME = 'Ghost User'
export const TEST_GUEST_EMAIL_PREFIX = 'ghost'
export const TEST_GUEST_EMAIL_DOMAIN = 'e2e.veyond.eu'
export const TEST_GUEST_PHONE = '+358401234567'

export function testGuestEmail(testId: string): string {
  return `${TEST_GUEST_EMAIL_PREFIX}-${testId}@${TEST_GUEST_EMAIL_DOMAIN}`
}
