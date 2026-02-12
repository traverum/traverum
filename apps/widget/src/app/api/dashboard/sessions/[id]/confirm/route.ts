import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { autoApprovePendingMinimum } from '@/lib/auto-approve'
import type { Database } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/dashboard/sessions/[id]/confirm
 *
 * Supplier manually confirms a session even though min_participants has not been
 * reached. This triggers auto-approve of all pending_minimum reservations for
 * the session — each guest gets a payment link.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: sessionId } = await params

  try {
    // Authenticate via Supabase JWT
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
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get session with experience and supplier
    const { data: sessionData } = await supabase
      .from('experience_sessions')
      .select(`
        *,
        experience:experiences(
          *,
          supplier:partners!experiences_partner_fk(*)
        )
      `)
      .eq('id', sessionId)
      .single()

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = sessionData as any
    const experience = session.experience
    const supplier = experience.supplier

    // Verify the authenticated user owns the supplier partner
    const { data: userPartner } = await supabase
      .from('user_partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('partner_id', supplier.id)
      .single()

    if (!userPartner) {
      return NextResponse.json({ error: 'Forbidden: you do not own this experience' }, { status: 403 })
    }

    // Check there are actually pending_minimum reservations
    const { count } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('reservation_status', 'pending_minimum')

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No pending reservations to confirm for this session' },
        { status: 400 }
      )
    }

    // Auto-approve all pending_minimum reservations
    const result = await autoApprovePendingMinimum(sessionId)

    return NextResponse.json({
      success: true,
      approved: result.approved,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Session confirm error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
