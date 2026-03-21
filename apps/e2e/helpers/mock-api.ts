import type { Page } from '@playwright/test'

const MOCK_STRIPE_URL = 'https://buy.stripe.com/test_e2e_ghost_session'
const MOCK_RESERVATION_ID = 'e2e-mock-reservation-00000001'

/**
 * Intercept POST /api/reservations at the browser level.
 * SSR pages still hit real staging Supabase — only the mutation is mocked.
 */
export async function mockSessionBookingAPI(page: Page) {
  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        paymentUrl: MOCK_STRIPE_URL,
        bookingId: MOCK_RESERVATION_ID,
      }),
    })
  })

  // Catch the Stripe redirect so the browser doesn't hang
  await page.route('https://buy.stripe.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><head><title>Stripe (mocked)</title></head><body>Stripe Payment Page</body></html>',
    })
  })
}

export async function mockRequestBookingAPI(page: Page) {
  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        reservationId: MOCK_RESERVATION_ID,
      }),
    })
  })
}

export { MOCK_STRIPE_URL, MOCK_RESERVATION_ID }
