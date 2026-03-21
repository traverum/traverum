import { test, expect } from '@playwright/test'
import {
  HOTEL_SLUG,
  EXPERIENCE_ID,
  EXPERIENCE_PRICE_CENTS,
  TEST_GUEST_PHONE,
  testGuestEmail,
} from '../../constants'
import { cleanupTestReservations, getReservation } from '../../helpers/api-client'

const BASE_URL = 'http://localhost:3000'

test.describe('POST /api/reservations', () => {
  test.beforeAll(async () => {
    await cleanupTestReservations()
  })

  test.afterAll(async () => {
    await cleanupTestReservations()
  })

  test('creates a request-based reservation and returns reservationId', async ({ request }) => {
    const testId = Date.now().toString()
    const participants = 2
    const totalCents = EXPERIENCE_PRICE_CENTS * participants

    const res = await request.post(`${BASE_URL}/api/reservations`, {
      data: {
        hotelSlug: HOTEL_SLUG,
        experienceId: EXPERIENCE_ID,
        participants,
        totalCents,
        isRequest: true,
        requestDate: '2027-08-15',
        requestTime: '10:00',
        guestName: 'Ghost User',
        guestEmail: testGuestEmail(testId),
        guestPhone: TEST_GUEST_PHONE,
      },
    })

    expect(res.status()).toBe(200)

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.reservationId).toBeTruthy()

    const row = await getReservation(body.reservationId)
    expect(row).not.toBeNull()
    expect(row!.reservation_status).toBe('pending')
    expect(row!.total_cents).toBe(totalCents)
    expect(row!.hotel_id).toBeTruthy()
    expect(row!.is_request).toBe(true)
  })

  test('returns 400 when experienceId is missing', async ({ request }) => {
    const testId = Date.now().toString()

    const res = await request.post(`${BASE_URL}/api/reservations`, {
      data: {
        hotelSlug: HOTEL_SLUG,
        // experienceId intentionally omitted
        participants: 1,
        totalCents: EXPERIENCE_PRICE_CENTS,
        guestName: 'Ghost Missing',
        guestEmail: testGuestEmail(testId),
      },
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})
