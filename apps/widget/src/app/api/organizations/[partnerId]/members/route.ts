import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get() { return undefined }, set() {}, remove() {} },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )
}

async function verifyOwnership(adminClient: any, authUserId: string, partnerId: string) {
  const { data: appUser } = await adminClient
    .from('users')
    .select('id')
    .eq('auth_id', authUserId)
    .single() as { data: { id: string } | null }

  if (!appUser) return null

  const { data: membership } = await adminClient
    .from('user_partners')
    .select('id, role')
    .eq('user_id', appUser.id)
    .eq('partner_id', partnerId)
    .single() as { data: { id: string; role: string } | null }

  if (!membership || membership.role !== 'owner') return null

  return appUser.id
}

// GET /api/organizations/[partnerId]/members — list org members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    const userClient = authenticateRequest(request)
    if (!userClient) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = await verifyOwnership(adminClient, user.id, partnerId)
    if (!callerId) {
      return NextResponse.json({ error: 'Only organization owners can view members' }, { status: 403 })
    }

    const { data: members, error } = await adminClient
      .from('user_partners')
      .select('user_id, role, created_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: true }) as {
        data: { user_id: string; role: string; created_at: string }[] | null
        error: any
      }

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [] })
    }

    const userIds = members.map(m => m.user_id)
    const { data: users } = await adminClient
      .from('users')
      .select('id, email')
      .in('id', userIds) as { data: { id: string; email: string }[] | null }

    const userMap = new Map((users || []).map(u => [u.id, u.email]))

    const enriched = members.map(m => ({
      user_id: m.user_id,
      email: userMap.get(m.user_id) || 'Unknown',
      role: m.role,
      joined_at: m.created_at,
      is_self: m.user_id === callerId,
    }))

    return NextResponse.json({ members: enriched })
  } catch (error) {
    console.error('Error in members endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/organizations/[partnerId]/members — remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params
    const userClient = authenticateRequest(request)
    if (!userClient) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = await verifyOwnership(adminClient, user.id, partnerId)
    if (!callerId) {
      return NextResponse.json({ error: 'Only organization owners can remove members' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (userId === callerId) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 })
    }

    const { data: targetMembership } = await adminClient
      .from('user_partners')
      .select('role')
      .eq('user_id', userId)
      .eq('partner_id', partnerId)
      .single() as { data: { role: string } | null }

    if (!targetMembership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMembership.role === 'owner') {
      const { count: ownerCount } = await adminClient
        .from('user_partners')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('role', 'owner') as { count: number | null }

      if (ownerCount && ownerCount <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 })
      }
    }

    await (adminClient.from('user_partners') as any)
      .delete()
      .eq('user_id', userId)
      .eq('partner_id', partnerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
