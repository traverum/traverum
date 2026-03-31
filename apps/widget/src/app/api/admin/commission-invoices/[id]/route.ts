import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminAccess, jsonResponse, optionsResponse } from '@/app/api/admin/_lib/verifyAdminAccess'

export async function OPTIONS() {
  return optionsResponse()
}

/**
 * PATCH — Update a commission invoice.
 * Supports: marking as paid, reverting to sent, editing notes.
 * Input: { status?, notes? }
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
  const { status, notes } = body

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('commission_invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return jsonResponse({ error: 'Invoice not found' }, 404)
  }

  const updateFields: Record<string, any> = {}

  if (status === 'paid') {
    updateFields.status = 'paid'
    updateFields.paid_at = new Date().toISOString()
  } else if (status === 'sent') {
    updateFields.status = 'sent'
    updateFields.paid_at = null
  } else if (status === 'draft') {
    updateFields.status = 'draft'
    updateFields.paid_at = null
    updateFields.sent_at = null
  }

  if (notes !== undefined) updateFields.notes = notes || null

  if (Object.keys(updateFields).length === 0) {
    return jsonResponse({ error: 'No fields to update' }, 400)
  }

  const { data: updated, error: updateErr } = await (supabase
    .from('commission_invoices') as any)
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    console.error('Error updating commission invoice:', updateErr)
    return jsonResponse({ error: 'Failed to update invoice' }, 500)
  }

  return jsonResponse({ invoice: updated })
}
