import { test, expect } from '@playwright/test'
import {
  HOTEL_SLUG,
  EXPERIENCE_TITLE,
  EXPERIENCE_SLUG,
  EXPERIENCE_ID,
  SESSION_ID,
  EXPERIENCE_PRICE_CENTS,
  TEST_GUEST_PHONE,
  testGuestEmail,
} from '../../constants'
import { mockSessionBookingAPI, MOCK_STRIPE_URL } from '../../helpers/mock-api'
import { fillCheckoutForm, submitCheckoutForm } from '../../helpers/widget-pages'

test.describe('Session booking golden path', () => {
  test('guest browses, reaches checkout, and is redirected to Stripe', async ({ page }) => {
    // 1. Land on the hotel widget page
    await page.goto(`/${HOTEL_SLUG}`)
    await expect(page.getByRole('heading', { name: EXPERIENCE_TITLE }).first()).toBeVisible()

    // 2. Click the experience card
    await page.getByRole('heading', { name: EXPERIENCE_TITLE }).first().click()
    await page.waitForURL(`**/${HOTEL_SLUG}/${EXPERIENCE_SLUG}`)

    // 3. Verify the experience detail page loaded with the booking section (desktop)
    await expect(page.getByRole('heading', { name: 'Booking' })).toBeVisible()

    // 4. Navigate to checkout (simulates clicking "Book Now" after selecting a session)
    const participants = 2
    const total = EXPERIENCE_PRICE_CENTS * participants
    const checkoutParams = new URLSearchParams({
      experienceId: EXPERIENCE_ID,
      sessionId: SESSION_ID,
      participants: participants.toString(),
      total: total.toString(),
    })
    await page.goto(`/${HOTEL_SLUG}/checkout?${checkoutParams}`)

    // 5. Verify checkout page rendered
    await expect(page.getByRole('heading', { name: 'Complete Your Booking' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Guest Details' })).toBeVisible()

    // 6. Set up API mock before filling form
    await mockSessionBookingAPI(page)

    // 7. Fill the checkout form
    const testId = Date.now().toString()
    await fillCheckoutForm(page, {
      firstName: 'Ghost',
      lastName: 'User',
      email: testGuestEmail(testId),
      phone: TEST_GUEST_PHONE,
    })

    // 8. Submit and verify redirect to Stripe
    await submitCheckoutForm(page)
    await page.waitForURL(/buy\.stripe\.com/, { timeout: 10000 })
    expect(page.url()).toContain('buy.stripe.com')
  })
})
