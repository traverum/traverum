import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// CORS headers for dashboard API (cross-origin calls from dashboard app)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const VEYOND_APP_HOSTS = ['veyond.app', 'www.veyond.app']
const VEYOND_URL = process.env.NEXT_PUBLIC_VEYOND_URL || 'https://veyond.app'

const PASSTHROUGH_PREFIXES = [
  '/api', '/_next', '/dashboard', '/receptionist',
  '/embed', '/booking', '/request', '/experiences',
]

function isPassthroughPath(pathname: string): boolean {
  return PASSTHROUGH_PREFIXES.some((p) => pathname.startsWith(p)) || pathname.includes('.')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host')?.replace(/:\d+$/, '') || ''
  const isVeyondApp = VEYOND_APP_HOSTS.includes(hostname)

  // ── veyond.app domain: rewrite clean URLs → /experiences/* internally ──
  if (isVeyondApp) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/experiences', request.url))
    }
    if (!isPassthroughPath(pathname)) {
      return NextResponse.rewrite(new URL(`/experiences${pathname}`, request.url))
    }
  }

  // ── book.veyond.eu: redirect /experiences* → veyond.app ──
  if (!isVeyondApp && pathname.startsWith('/experiences')) {
    const newPath = pathname.replace(/^\/experiences/, '') || '/'
    const search = request.nextUrl.search
    return NextResponse.redirect(`${VEYOND_URL}${newPath}${search}`, 301)
  }

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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|embed\\.js).*)'],
}
