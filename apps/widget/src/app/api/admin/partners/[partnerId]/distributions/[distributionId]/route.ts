import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * PATCH — Update commission rates for a distribution.
 * Body: { commissionSupplier?, commissionHotel?, commissionPlatform? }
 * Percentages must sum to 100.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; distributionId: string }> }
) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { partnerId, distributionId } = await params
  const body = await request.json()
  const commissionSupplier = body.commissionSupplier
  const commissionHotel = body.commissionHotel
  const commissionPlatform = body.commissionPlatform

  if (
    commissionSupplier == null ||
    commissionHotel == null ||
    commissionPlatform == null
  ) {
    return jsonResponse(
      { error: 'commissionSupplier, commissionHotel, and commissionPlatform are required' },
      400
    )
  }

  const sum =
    Number(commissionSupplier) + Number(commissionHotel) + Number(commissionPlatform)
  if (Math.round(sum) !== 100) {
    return jsonResponse(
      { error: 'Commission percentages must sum to 100' },
      400
    )
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('distributions')
    .select('id, hotel_id')
    .eq('id', distributionId)
    .single()

  if (fetchErr || !existing) {
    return jsonResponse({ error: 'Distribution not found' }, 404)
  }

  if ((existing as any).hotel_id !== partnerId) {
    return jsonResponse({ error: 'Distribution does not belong to this partner' }, 403)
  }

  const { data: updated, error: updateErr } = await (supabase
    .from('distributions') as any)
    .update({
      commission_supplier: Number(commissionSupplier),
      commission_hotel: Number(commissionHotel),
      commission_platform: Number(commissionPlatform),
    })
    .eq('id', distributionId)
    .select()
    .single()

  if (updateErr) {
    console.error('Error updating distribution:', updateErr)
    return jsonResponse({ error: 'Failed to update distribution' }, 500)
  }

  return jsonResponse({ distribution: updated })
}
