import { test, expect } from '@playwright/test'
import {
  HOTEL_SLUG,
  EXPERIENCE_TITLE,
  EXPERIENCE_SLUG,
  EXPERIENCE_ID,
  EXPERIENCE_PRICE_CENTS,
  TEST_GUEST_PHONE,
  testGuestEmail,
} from '../../constants'
import { mockRequestBookingAPI, MOCK_RESERVATION_ID } from '../../helpers/mock-api'
import { fillCheckoutForm, submitCheckoutForm } from '../../helpers/widget-pages'

test.describe('Request booking golden path', () => {
  test('guest submits a request and is redirected to the reservation page', async ({ page }) => {
    // 1. Land on the hotel widget page
    await page.goto(`/${HOTEL_SLUG}`)
    await expect(page.getByRole('heading', { name: EXPERIENCE_TITLE }).first()).toBeVisible()

    // 2. Click the experience card
    await page.getByRole('heading', { name: EXPERIENCE_TITLE }).first().click()
    await page.waitForURL(`**/${HOTEL_SLUG}/${EXPERIENCE_SLUG}`)

    // 3. Navigate to checkout in request mode (simulates choosing a custom date/time)
    const participants = 2
    const total = EXPERIENCE_PRICE_CENTS * participants
    const checkoutParams = new URLSearchParams({
      experienceId: EXPERIENCE_ID,
      participants: participants.toString(),
      total: total.toString(),
      isRequest: 'true',
      requestDate: '2027-06-15',
      requestTime: '10:00',
    })
    await page.goto(`/${HOTEL_SLUG}/checkout?${checkoutParams}`)

    // 4. Verify checkout shows request mode
    await expect(page.getByRole('heading', { name: 'Complete Your Request' })).toBeVisible()

    // 5. Set up API mock
    await mockRequestBookingAPI(page)

    // 6. Fill the checkout form
    const testId = Date.now().toString()
    await fillCheckoutForm(page, {
      firstName: 'Ghost',
      lastName: 'Requester',
      email: testGuestEmail(testId),
      phone: TEST_GUEST_PHONE,
    })

    // 7. Submit and verify redirect to reservation page
    await submitCheckoutForm(page)
    await page.waitForURL(
      new RegExp(`/${HOTEL_SLUG}/reservation/${MOCK_RESERVATION_ID}`),
      { timeout: 10000 }
    )
    expect(page.url()).toContain(`/reservation/${MOCK_RESERVATION_ID}`)
  })
})
