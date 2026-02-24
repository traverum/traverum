import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

/**
 * PATCH — Mark a hotel payout as paid.
 * Input: { status: 'paid', paymentRef?, paymentMethod?, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { status, paymentRef, paymentMethod, notes } = body

  if (status !== 'paid') {
    return NextResponse.json(
      { error: 'Only status "paid" is supported' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('hotel_payouts')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
  }

  if ((existing as any).status === 'paid') {
    return NextResponse.json({ error: 'Payout already marked as paid' }, { status: 409 })
  }

  const updateFields: Record<string, any> = {
    status: 'paid',
    paid_at: new Date().toISOString(),
  }

  if (paymentRef) updateFields.payment_ref = paymentRef
  if (paymentMethod) updateFields.payment_method = paymentMethod
  if (notes) updateFields.notes = notes

  const { data: updated, error: updateErr } = await supabase
    .from('hotel_payouts')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    console.error('Error updating payout:', updateErr)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }

  return NextResponse.json({ payout: updated })
}
