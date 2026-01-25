import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type Experience = Database['public']['Tables']['experiences']['Row']
type Distribution = Database['public']['Tables']['distributions']['Row']

type ExperienceWithPartner = Experience & {
  partner: { id: string; name: string } | null
}

export type ExperienceWithSelection = Experience & {
  supplier_name: string
  is_selected: boolean
  distribution_id: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user record to find partner_id
    const { data: userData } = await adminClient
      .from('users')
      .select('partner_id')
      .eq('auth_id', user.id)
      .single() as { data: { partner_id: string } | null }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hotelPartnerId = userData.partner_id

    // Fetch all active experiences with their supplier info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: experiences, error: expError } = await (adminClient as any)
      .from('experiences')
      .select(`
        *,
        partner:partners!experiences_partner_fk (
          id,
          name
        )
      `)
      .eq('experience_status', 'active')
      .order('title') as { data: ExperienceWithPartner[] | null; error: Error | null }

    if (expError) {
      console.error('Error fetching experiences:', expError)
      return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
    }

    // Fetch distributions for this hotel
    const { data: distributions } = await adminClient
      .from('distributions')
      .select('*')
      .eq('hotel_id', hotelPartnerId) as { data: Distribution[] | null }

    // Map experiences with selection status
    const experiencesWithSelection: ExperienceWithSelection[] = (experiences || []).map((exp) => {
      const distribution = distributions?.find(d => d.experience_id === exp.id)
      
      return {
        ...exp,
        supplier_name: exp.partner?.name || 'Unknown Supplier',
        is_selected: distribution?.is_active === true,
        distribution_id: distribution?.id || null,
      }
    })

    return NextResponse.json({ experiences: experiencesWithSelection })
  } catch (error) {
    console.error('Error in experiences API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
