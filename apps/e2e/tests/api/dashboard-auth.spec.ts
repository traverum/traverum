import { test, expect } from '@playwright/test'

import { WIDGET_E2E_BASE_URL } from '../../constants'

const BASE_URL = WIDGET_E2E_BASE_URL
const FAKE_RESERVATION_ID = '00000000-0000-0000-0000-000000000000'

test.describe('Dashboard auth guard', () => {
  test('rejects accept request with no Authorization header', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/dashboard/requests/${FAKE_RESERVATION_ID}/accept`
    )

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toContain('authorization')
  })

  test('rejects accept request with garbage bearer token', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/dashboard/requests/${FAKE_RESERVATION_ID}/accept`,
      {
        headers: {
          Authorization: 'Bearer totally-not-a-valid-jwt-token',
        },
      }
    )

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})
