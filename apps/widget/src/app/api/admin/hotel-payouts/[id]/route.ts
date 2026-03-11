import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * PATCH — Update a hotel payout.
 * Supports: marking as paid, editing payment details, or reverting to pending.
 * Input: { status?, paymentRef?, paymentMethod?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { id } = await params
  const body = await request.json()
  const { status, paymentRef, paymentMethod, notes } = body

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('hotel_payouts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return jsonResponse({ error: 'Payout not found' }, 404)
  }

  const updateFields: Record<string, any> = {}

  if (status === 'paid') {
    updateFields.status = 'paid'
    updateFields.paid_at = new Date().toISOString()
  } else if (status === 'pending') {
    updateFields.status = 'pending'
    updateFields.paid_at = null
  }

  if (paymentRef !== undefined) updateFields.payment_ref = paymentRef || null
  if (paymentMethod !== undefined) updateFields.payment_method = paymentMethod || null
  if (notes !== undefined) updateFields.notes = notes || null

  if (Object.keys(updateFields).length === 0) {
    return jsonResponse({ error: 'No fields to update' }, 400)
  }

  const { data: updated, error: updateErr } = await (supabase
    .from('hotel_payouts') as any)
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    console.error('Error updating payout:', updateErr)
    return jsonResponse({ error: 'Failed to update payout' }, 500)
  }

  return jsonResponse({ payout: updated })
}

/**
 * DELETE — Delete a hotel payout and unlink its bookings.
 * The linked bookings' hotel_payout_id is set back to null so they
 * reappear in the pending obligations view.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdminAccess(request)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('hotel_payouts')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return jsonResponse({ error: 'Payout not found' }, 404)
  }

  // Unlink bookings first so they return to pending obligations
  await (supabase.from('bookings') as any)
    .update({ hotel_payout_id: null, updated_at: new Date().toISOString() })
    .eq('hotel_payout_id', id)

  const { error: deleteErr } = await supabase
    .from('hotel_payouts')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    console.error('Error deleting payout:', deleteErr)
    return jsonResponse({ error: 'Failed to delete payout' }, 500)
  }

  return jsonResponse({ success: true })
}
