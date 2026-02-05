/**
 * Demo mode configuration
 * 
 * The demo hotel (hotel-traverum) automatically runs in demo mode,
 * meaning booking submissions show a success banner without making actual API calls.
 */

export const DEMO_HOTEL_SLUG = 'hotel-traverum'

/**
 * Check if a hotel should run in demo mode
 */
export function isDemoHotel(hotelSlug: string): boolean {
  return hotelSlug === DEMO_HOTEL_SLUG
}
