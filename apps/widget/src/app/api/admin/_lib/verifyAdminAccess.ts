import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isSuperadmin } from '@/lib/superadmin'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function corsHeaders() {
  return CORS_HEADERS
}

export function optionsResponse() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice('Bearer '.length).trim() || null
}

export async function verifyAdminAccess(request: NextRequest): Promise<boolean> {
  const bearerToken = getBearerToken(request)
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && bearerToken === cronSecret) return true

  try {
    const adminClient = createAdminClient()

    if (bearerToken) {
      const { data, error } = await adminClient.auth.getUser(bearerToken)
      if (error || !data.user) return false
      return await isSuperadmin(adminClient, data.user.id)
    }

    const cookieClient = await createClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (!user) return false
    return await isSuperadmin(adminClient, user.id)
  } catch {
    return false
  }
}
