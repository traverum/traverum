import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookies can only be modified in a Server Action or Route Handler
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Cookies can only be modified in a Server Action or Route Handler
          }
        },
      },
    }
  )
}

// Admin client with service role for server-side operations
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Disable Next.js fetch cache to ensure fresh data from Supabase
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
          return fetch(url, {
            ...options,
            cache: 'no-store',
          })
        },
      },
    }
  )
}
