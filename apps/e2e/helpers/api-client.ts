/**
 * Helpers for API-level E2E tests that need direct Supabase access.
 * Uses raw fetch against the PostgREST API (no SDK needed).
 */

function supabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim()
  if (!url) {
    throw new Error(
      'E2E helpers need NEXT_PUBLIC_SUPABASE_URL (e.g. GitHub secret E2E_SUPABASE_URL on the Test workflow).'
    )
  }
  return url
}

function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) {
    throw new Error(
      'E2E helpers need SUPABASE_SERVICE_ROLE_KEY (e.g. GitHub secret E2E_SUPABASE_SERVICE_ROLE_KEY).'
    )
  }
  return key
}

function headers() {
  const key = serviceRoleKey()
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
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
    `${supabaseUrl()}/rest/v1/reservations?guest_email=like.ghost-*@e2e.veyond.eu`,
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
    `${supabaseUrl()}/rest/v1/reservations?id=eq.${id}&select=*`,
    { method: 'GET', headers: headers() }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`getReservation failed (${res.status}): ${body}`)
  }

  const rows = await res.json()
  return rows[0] ?? null
}
