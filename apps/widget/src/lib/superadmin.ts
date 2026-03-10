/**
 * Check if the given auth user is a superadmin.
 * Uses the service-role admin client to bypass RLS.
 */
export async function isSuperadmin(
  adminClient: any,
  authUid: string
): Promise<boolean> {
  const { data } = await adminClient
    .from('users')
    .select('is_superadmin')
    .eq('auth_id', authUid)
    .single() as { data: { is_superadmin: boolean } | null }

  return data?.is_superadmin === true
}

/**
 * Resolve auth UUID to app user id + superadmin status.
 * Returns null if user not found.
 */
export async function resolveAdminUser(
  adminClient: any,
  authUid: string
): Promise<{ userId: string; isSuperadmin: boolean } | null> {
  const { data } = await adminClient
    .from('users')
    .select('id, is_superadmin')
    .eq('auth_id', authUid)
    .single() as { data: { id: string; is_superadmin: boolean } | null }

  if (!data) return null

  return {
    userId: data.id,
    isSuperadmin: data.is_superadmin === true,
  }
}
