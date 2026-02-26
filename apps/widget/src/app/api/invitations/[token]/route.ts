import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/invitations/[token] — fetch invite info (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    const { data: invitation } = await supabase
      .from('partner_invitations')
      .select('id, token, partner_id, role, used_at, expires_at')
      .eq('token', token)
      .single() as { data: {
        id: string
        token: string
        partner_id: string
        role: string
        used_at: string | null
        expires_at: string
      } | null }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.used_at) {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
    }

    const { data: partner } = await supabase
      .from('partners')
      .select('name')
      .eq('id', invitation.partner_id)
      .single() as { data: { name: string } | null }

    if (!partner) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      partner_name: partner.name,
      role: invitation.role,
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/invitations/[token] — accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const adminClient = createAdminClient()
    const body = await request.json()

    // Validate invitation
    const { data: invitation } = await adminClient
      .from('partner_invitations')
      .select('id, partner_id, role, used_at, expires_at')
      .eq('token', token)
      .single() as { data: {
        id: string
        partner_id: string
        role: string
        used_at: string | null
        expires_at: string
      } | null }

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.used_at) {
      return NextResponse.json({ error: 'This invitation has already been used' }, { status: 410 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
    }

    // Check if the caller is already authenticated (existing user joining an org)
    const authHeader = request.headers.get('authorization')
    let authUserId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      const supabaseAuth = await createClient()
      const { data: { user } } = await supabaseAuth.auth.getUser()
      if (user) {
        authUserId = user.id
      }
    }

    let appUserId: string

    if (authUserId) {
      // Path B: Existing user joining an org
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('auth_id', authUserId)
        .single() as { data: { id: string } | null }

      if (!existingUser) {
        return NextResponse.json({ error: 'User record not found' }, { status: 404 })
      }

      // Check not already a member
      const { data: existingMembership } = await adminClient
        .from('user_partners')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('partner_id', invitation.partner_id)
        .single() as { data: { id: string } | null }

      if (existingMembership) {
        return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 409 })
      }

      appUserId = existingUser.id

      // Check if they have existing orgs (for is_default)
      const { count: orgCount } = await adminClient
        .from('user_partners')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', appUserId) as { count: number | null }

      const isFirst = !orgCount || orgCount === 0

      await (adminClient.from('user_partners') as any).insert({
        user_id: appUserId,
        partner_id: invitation.partner_id,
        role: invitation.role,
        is_default: isFirst,
      })

      if (isFirst) {
        await (adminClient.from('users') as any)
          .update({ partner_id: invitation.partner_id })
          .eq('id', appUserId)
      }

      // Mark invitation as used
      await (adminClient.from('partner_invitations') as any)
        .update({ used_by: appUserId, used_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ success: true, mode: 'join' })

    } else {
      // Path A: New user signup
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      // Create auth user (email pre-confirmed since invite link is the trust)
      const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (createError) {
        if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
          return NextResponse.json({
            error: 'An account with this email already exists. Please log in instead.',
            code: 'EMAIL_EXISTS',
          }, { status: 409 })
        }
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      // Wait briefly for the trigger to create the users row
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get the app user record (created by handle_new_user trigger)
      const { data: newUser } = await adminClient
        .from('users')
        .select('id')
        .eq('auth_id', newAuthUser.user.id)
        .single() as { data: { id: string } | null }

      if (!newUser) {
        console.error('User record not created by trigger for auth_id:', newAuthUser.user.id)
        return NextResponse.json({ error: 'Account created but setup failed. Please try logging in.' }, { status: 500 })
      }

      appUserId = newUser.id

      // Link user to partner
      await (adminClient.from('user_partners') as any).insert({
        user_id: appUserId,
        partner_id: invitation.partner_id,
        role: invitation.role,
        is_default: true,
      })

      // Set partner_id on user record
      await (adminClient.from('users') as any)
        .update({ partner_id: invitation.partner_id })
        .eq('id', appUserId)

      // Update partner email to the new owner's email (only for owner role)
      if (invitation.role === 'owner') {
        // Check if there are other owners already
        const { count: ownerCount } = await adminClient
          .from('user_partners')
          .select('id', { count: 'exact', head: true })
          .eq('partner_id', invitation.partner_id)
          .eq('role', 'owner') as { count: number | null }

        // Only update partner email if this is the first/only owner
        if (ownerCount && ownerCount <= 1) {
          await (adminClient.from('partners') as any)
            .update({ email })
            .eq('id', invitation.partner_id)
        }
      }

      // Mark invitation as used
      await (adminClient.from('partner_invitations') as any)
        .update({ used_by: appUserId, used_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ success: true, mode: 'signup' })
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
