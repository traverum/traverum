import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// POST /api/organizations/[partnerId]/invitations — generate invite link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params

    // Authenticate via JWT from Authorization header (cross-origin from dashboard)
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const userClient = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get() { return undefined }, set() {}, remove() {} },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verify caller is an owner
    const { data: appUser } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null }

    if (!appUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: membership } = await adminClient
      .from('user_partners')
      .select('id, role')
      .eq('user_id', appUser.id)
      .eq('partner_id', partnerId)
      .single() as { data: { id: string; role: string } | null }

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can create invitations' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const role = body.role || 'owner'

    // Reuse existing active invitation with same partner + role
    const { data: existing } = await adminClient
      .from('partner_invitations')
      .select('token, expires_at')
      .eq('partner_id', partnerId)
      .eq('role', role)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1) as { data: { token: string; expires_at: string }[] | null }

    if (existing && existing.length > 0) {
      return NextResponse.json({
        token: existing[0].token,
        expires_at: existing[0].expires_at,
      })
    }

    // Create new invitation
    const { data: invitation, error } = await (adminClient
      .from('partner_invitations') as any)
      .insert({
        partner_id: partnerId,
        role,
        created_by: appUser.id,
      })
      .select('token, expires_at')
      .single() as { data: { token: string; expires_at: string } | null; error: any }

    if (error || !invitation) {
      console.error('Error creating invitation:', error)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    return NextResponse.json({
      token: invitation.token,
      expires_at: invitation.expires_at,
    })
  } catch (error) {
    console.error('Error in invitations endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
