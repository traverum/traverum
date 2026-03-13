import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// CORS headers for dashboard API (cross-origin calls from dashboard app)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS for dashboard/organization/admin APIs (cross-origin calls from dashboard & admin apps)
  if (pathname.startsWith('/api/dashboard') || pathname.startsWith('/api/organizations') || pathname.startsWith('/api/admin')) {
    // Preflight OPTIONS → respond immediately
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: corsHeaders })
    }
    // Actual request → add CORS headers to response
    const response = NextResponse.next()
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  // Only protect /dashboard and /receptionist routes
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/receptionist')) {
    return NextResponse.next()
  }

  // Allow login pages without auth
  if (pathname === '/dashboard/login' || pathname === '/receptionist/login') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // No session - redirect to appropriate login page
  if (!user) {
    const loginPath = pathname.startsWith('/receptionist') ? '/receptionist/login' : '/dashboard/login'
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/receptionist/:path*', '/api/dashboard/:path*', '/api/organizations/:path*', '/api/admin/:path*'],
}
