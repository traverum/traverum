import { supabase } from '@/integrations/supabase/client';

export const WIDGET_API =
  import.meta.env.VITE_WIDGET_API_URL || 'https://book.veyond.eu';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    'Content-Type': 'application/json',
    ...(session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : {}),
  };
}

export async function fetchAdminJson<T>(
  path: string,
  init?: Omit<RequestInit, 'headers'>
): Promise<T> {
  const response = await fetch(`${WIDGET_API}${path}`, {
    ...init,
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const errorPayload = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(errorPayload.error || 'Request failed');
  }

  return (await response.json()) as T;
}
