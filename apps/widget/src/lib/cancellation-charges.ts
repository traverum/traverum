import { chargeOffSession, getPaymentMethodFromSetupIntent } from './stripe'
import type { createAdminClient } from './supabase/server'

type AdminClient = ReturnType<typeof createAdminClient>

export interface CancellationChargeResult {
  success: boolean
  chargeId?: string
  paymentIntentId?: string
  failureReason?: string
}

/**
 * Charge a guest's saved card for a late cancellation or no-show,
 * then record the result in the cancellation_charges table.
 *
 * The booking is always cancelled regardless of charge outcome.
 * Failed charges fall back to the monthly invoice process.
 */
export async function processCancellationCharge(params: {
  supabase: AdminClient
  bookingId: string
  stripeSetupIntentId: string
  stripeCustomerId: string
  amountCents: number
  currency: string
  reason: 'cancellation' | 'no_show'
  commissionSplitCents: { supplier: number; hotel: number; platform: number }
}): Promise<CancellationChargeResult> {
  const {
    supabase,
    bookingId,
    stripeSetupIntentId,
    stripeCustomerId,
    amountCents,
    currency,
    reason,
    commissionSplitCents,
  } = params

  let paymentMethodId: string
  try {
    paymentMethodId = await getPaymentMethodFromSetupIntent(stripeSetupIntentId)
  } catch (err) {
    console.error(`Failed to retrieve payment method for booking ${bookingId}:`, err)

    await insertCancellationCharge(supabase, {
      bookingId,
      stripeCustomerId,
      stripePaymentIntentId: null,
      amountCents,
      status: 'failed',
      commissionSplitCents,
    })

    return { success: false, failureReason: 'payment_method_retrieval_failed' }
  }

  const chargeResult = await chargeOffSession({
    customerId: stripeCustomerId,
    paymentMethodId,
    amountCents,
    currency,
    bookingId,
    reason,
  })

  const status = chargeResult.success ? 'succeeded' : 'failed'
  const paymentIntentId = chargeResult.paymentIntentId ?? null

  const { data: chargeRecord } = await insertCancellationCharge(supabase, {
    bookingId,
    stripeCustomerId,
    stripePaymentIntentId: paymentIntentId,
    amountCents,
    status,
    commissionSplitCents,
  })

  if (chargeResult.success) {
    console.log(
      `Cancellation charge succeeded for booking ${bookingId}: ${amountCents} cents (${reason})`
    )
    return {
      success: true,
      chargeId: (chargeRecord as any)?.id,
      paymentIntentId: chargeResult.paymentIntentId,
    }
  }

  console.warn(
    `Cancellation charge failed for booking ${bookingId}: ${chargeResult.reason}` +
      (chargeResult.declineCode ? ` (decline: ${chargeResult.declineCode})` : '')
  )

  return {
    success: false,
    chargeId: (chargeRecord as any)?.id,
    paymentIntentId: chargeResult.paymentIntentId,
    failureReason: chargeResult.reason,
  }
}

async function insertCancellationCharge(
  supabase: AdminClient,
  data: {
    bookingId: string
    stripeCustomerId: string
    stripePaymentIntentId: string | null
    amountCents: number
    status: 'pending' | 'succeeded' | 'failed'
    commissionSplitCents: { supplier: number; hotel: number; platform: number }
  }
) {
  return (supabase.from('cancellation_charges') as any)
    .insert({
      booking_id: data.bookingId,
      stripe_customer_id: data.stripeCustomerId,
      stripe_payment_intent_id: data.stripePaymentIntentId,
      amount_cents: data.amountCents,
      status: data.status,
      commission_split_cents: data.commissionSplitCents,
    })
    .select()
    .single()
}
