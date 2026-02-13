import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { DEFAULT_COMMISSION, SELF_OWNED_COMMISSION } from '@traverum/shared'

export const dynamic = 'force-dynamic'

type DistributionUpdate = Database['public']['Tables']['distributions']['Update']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { experience_id, is_active, partner_id, hotel_config_id } = body as {
      experience_id: string;
      is_active: boolean;
      partner_id: string;
      hotel_config_id: string;
    }

    if (!experience_id || typeof is_active !== 'boolean' || !partner_id || !hotel_config_id) {
      return NextResponse.json({ error: 'Invalid request body. Required: experience_id, is_active, partner_id, hotel_config_id' }, { status: 400 })
    }

    // Validate that user has access to this partner via user_partners
    const { data: userData } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: membership } = await adminClient
      .from('user_partners')
      .select('id')
      .eq('user_id', userData.id)
      .eq('partner_id', partner_id)
      .single() as { data: { id: string } | null }

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized for this partner' }, { status: 403 })
    }

    // Check if distribution exists
    // hotel_config_id is added via migration but not yet in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingDist } = await (adminClient as any)
      .from('distributions')
      .select('id')
      .eq('hotel_config_id', hotel_config_id)
      .eq('experience_id', experience_id)
      .single() as { data: { id: string } | null }

    if (existingDist) {
      // Update existing distribution
      const updateData: DistributionUpdate = { is_active }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminClient as any)
        .from('distributions')
        .update(updateData)
        .eq('id', existingDist.id)

      if (error) {
        console.error('Error updating distribution:', error)
        return NextResponse.json({ error: 'Failed to update distribution' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'updated' })
    } else if (is_active) {
      // Create new distribution (only when activating)
      // Check if this is a self-owned experience (hotel selling their own experience)
      const { data: experienceData } = await adminClient
        .from('experiences')
        .select('partner_id')
        .eq('id', experience_id)
        .single() as { data: { partner_id: string } | null }

      const isSelfOwned = experienceData?.partner_id === partner_id

      // Set commission rates: 92/0/8 for self-owned, 80/12/8 for regular
      const commissionRates = isSelfOwned
        ? SELF_OWNED_COMMISSION
        : DEFAULT_COMMISSION

      // hotel_config_id is added via migration but not yet in generated types
      const newDistribution = {
        hotel_id: partner_id,
        hotel_config_id,
        experience_id,
        is_active: true,
        commission_supplier: commissionRates.supplier,
        commission_hotel: commissionRates.hotel,
        commission_platform: commissionRates.platform,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (adminClient as any)
        .from('distributions')
        .insert(newDistribution)

      if (error) {
        console.error('Error creating distribution:', error)
        return NextResponse.json({ error: 'Failed to create distribution' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'created' })
    }

    // Trying to deactivate non-existent distribution - no action needed
    return NextResponse.json({ success: true, action: 'noop' })
  } catch (error) {
    console.error('Error in distributions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
