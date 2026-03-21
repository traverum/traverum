/**
 * Helpers for API-level E2E tests that need direct Supabase access.
 * Uses raw fetch against the PostgREST API (no SDK needed).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function headers() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

/**
 * Delete all test reservations created by E2E tests.
 * Identifies them by the `ghost-*@e2e.veyond.eu` email pattern.
 */
export async function cleanupTestReservations(): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/reservations?guest_email=like.ghost-*@e2e.veyond.eu`,
    { method: 'DELETE', headers: headers() }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cleanup failed (${res.status}): ${body}`)
  }

  const deleted = await res.json().catch(() => [])
  return Array.isArray(deleted) ? deleted.length : 0
}

/**
 * Fetch a single reservation by ID for assertion.
 */
export async function getReservation(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=*`,
    { method: 'GET', headers: headers() }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getReservation failed (${res.status}): ${body}`)
  }

  const rows = await res.json()
  return rows[0] ?? null
}
