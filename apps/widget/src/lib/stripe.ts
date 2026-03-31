import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

interface CreatePaymentLinkParams {
  reservationId: string
  experienceTitle: string
  amountCents: number
  currency: string
  successUrl: string
  cancelUrl: string
}

/**
 * Create a Stripe Payment Link for a reservation
 */
export async function createPaymentLink({
  reservationId,
  experienceTitle,
  amountCents,
  currency,
  successUrl,
  cancelUrl,
}: CreatePaymentLinkParams) {
  // Create a price for this booking
  const price = await stripe.prices.create({
    unit_amount: amountCents,
    currency: currency.toLowerCase(),
    product_data: {
      name: experienceTitle,
    },
  })
  
  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: successUrl,
      },
    },
    metadata: {
      reservationId,
    },
    payment_intent_data: {
      metadata: {
        reservationId,
      },
    },
  })
  
  return {
    id: paymentLink.id,
    url: paymentLink.url,
  }
}

/**
 * Create a refund for a booking
 */
export async function createRefund(chargeId: string) {
  const refund = await stripe.refunds.create({
    charge: chargeId,
  })
  
  return refund
}

/**
 * Create a transfer to a connected Stripe account
 */
export async function createTransfer(
  amountCents: number,
  currency: string,
  destinationAccountId: string,
  bookingId: string,
  sourceTransaction?: string // Charge ID - required for test mode transfers
) {
  const transferParams: Stripe.TransferCreateParams = {
    amount: amountCents,
    currency: currency.toLowerCase(),
    destination: destinationAccountId,
    metadata: {
      bookingId,
    },
  }
  
  // In test mode, transfers require source_transaction (charge ID)
  // This allows transferring funds even if platform balance is insufficient
  if (sourceTransaction) {
    transferParams.source_transaction = sourceTransaction
  }
  
  const transfer = await stripe.transfers.create(transferParams)
  
  return transfer
}

/**
 * Create a Stripe Customer for a guest (for card guarantee / off-session use).
 */
export async function createStripeCustomer(
  guestEmail: string,
  guestName: string,
  reservationId: string
) {
  const customer = await stripe.customers.create(
    {
      email: guestEmail,
      name: guestName,
      metadata: { reservationId },
    },
    { idempotencyKey: `customer_${reservationId}` }
  )
  return customer
}

/**
 * Create a Setup Intent for saving a guest's card (pay_on_site guarantee).
 * usage: 'off_session' allows charging the card later without the guest present.
 */
export async function createSetupIntent(
  customerId: string,
  reservationId: string
) {
  const setupIntent = await stripe.setupIntents.create(
    {
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { reservationId },
    },
    { idempotencyKey: `setup_${reservationId}` }
  )
  return setupIntent
}

/**
 * Charge a guest's saved card off-session (cancellation fees, no-show charges).
 * Returns a result object instead of throwing so callers can handle failures gracefully.
 */
export async function chargeOffSession(params: {
  customerId: string
  paymentMethodId: string
  amountCents: number
  currency: string
  bookingId: string
  reason: 'cancellation' | 'no_show'
}): Promise<
  | { success: true; paymentIntentId: string }
  | { success: false; reason: string; paymentIntentId?: string; declineCode?: string }
> {
  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: params.amountCents,
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        payment_method: params.paymentMethodId,
        off_session: true,
        confirm: true,
      },
      { idempotencyKey: `charge_${params.bookingId}_${params.reason}` }
    )
    return { success: true, paymentIntentId: paymentIntent.id }
  } catch (err: any) {
    if (err.code === 'authentication_required') {
      return {
        success: false,
        reason: 'authentication_required',
        paymentIntentId: err.raw?.payment_intent?.id,
      }
    }
    if (err.type === 'StripeCardError') {
      return {
        success: false,
        reason: err.code || 'card_declined',
        declineCode: err.raw?.decline_code,
      }
    }
    throw err
  }
}

/**
 * Retrieve the default PaymentMethod from a confirmed Setup Intent.
 */
export async function getPaymentMethodFromSetupIntent(setupIntentId: string) {
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  if (setupIntent.status !== 'succeeded') {
    throw new Error(`SetupIntent ${setupIntentId} is not succeeded (status: ${setupIntent.status})`)
  }
  return setupIntent.payment_method as string
}

/**
 * Verify a Stripe webhook signature.
 * Tries the platform account secret first, then the Connect webhook secret as fallback.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (primaryError) {
    if (process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET
      )
    }
    throw primaryError
  }
}
