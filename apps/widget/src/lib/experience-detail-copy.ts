import { getCancellationPolicyExperienceIntro } from '@/lib/availability'

export const EXPERIENCE_DETAIL_PROVIDER_CANCEL_REFUND =
  'You will receive a full refund if the provider cancels due to weather or emergency.'

export function buildExperienceCancellationSummary(
  cancellationPolicy: Parameters<typeof getCancellationPolicyExperienceIntro>[0]
) {
  return `${getCancellationPolicyExperienceIntro(cancellationPolicy)} ${EXPERIENCE_DETAIL_PROVIDER_CANCEL_REFUND}`
}

type PaymentMode = 'stripe' | 'pay_on_site'

/**
 * "How it works" — dynamic copy for the Good to Know section.
 * Covers every combination of payment mode × booking path.
 *
 * Copy rules: lead with the action, end with the benefit.
 * Never start a sentence with "No".
 */
export function buildHowItWorksText({
  paymentMode,
  hasSessions,
  allowsRequests,
  isRental,
}: {
  paymentMode: PaymentMode
  hasSessions: boolean
  allowsRequests: boolean
  isRental: boolean
}): string {
  if (isRental) {
    if (paymentMode === 'pay_on_site') {
      return 'Choose your dates and send a request. The provider will respond within 48 hours. Pay the provider directly after the experience.'
    }
    return 'Choose your dates and send a request. The provider will respond within 48 hours. You pay online once your request is approved.'
  }

  if (hasSessions && allowsRequests) {
    if (paymentMode === 'pay_on_site') {
      return 'Pick an available time to reserve instantly, or request a different time. The provider responds to requests within 48 hours. Pay the provider directly after the experience.'
    }
    return 'Pick an available time to book instantly, or request a different time. The provider responds to requests within 48 hours. You pay online during checkout.'
  }

  if (hasSessions) {
    if (paymentMode === 'pay_on_site') {
      return 'Select a date and time to reserve your spot instantly. Pay the provider directly after the experience.'
    }
    return 'Select a date and time to book instantly. You pay online during checkout.'
  }

  // Request-only (no sessions)
  if (paymentMode === 'pay_on_site') {
    return 'Select your preferred date and time and send a request. The provider will respond within 48 hours. Pay the provider directly after the experience.'
  }
  return 'Select your preferred date and time and send a request. The provider will respond within 48 hours. You pay online once your request is approved.'
}

/**
 * "Payment" — explains how payment works for this experience.
 * Shown in the Good to Know section.
 */
export function buildPaymentText({
  paymentMode,
  isRental,
}: {
  paymentMode: PaymentMode
  isRental: boolean
}): string {
  if (paymentMode === 'pay_on_site') {
    return 'Pay the provider directly after the experience. Your card simply secures your reservation.'
  }
  if (isRental) {
    return 'You pay securely online once the provider approves your request.'
  }
  return 'You pay securely online during checkout.'
}

/**
 * Short note shown near the CTA button to set expectations.
 * Returns null when no extra note is needed (default Stripe + instant is self-evident).
 */
export function buildCtaNote({
  paymentMode,
  isRequest,
}: {
  paymentMode: PaymentMode
  isRequest: boolean
}): string | null {
  if (paymentMode === 'pay_on_site') {
    if (isRequest) {
      return 'Reserve now, pay the provider on site.'
    }
    return 'Pay on site after the experience. Your card secures your spot.'
  }
  if (isRequest) {
    return "You're only charged after the provider accepts."
  }
  return null
}
