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
  bookingId: string
) {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    destination: destinationAccountId,
    metadata: {
      bookingId,
    },
  })
  
  return transfer
}

/**
 * Verify a Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
