import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { CheckoutForm } from '@/components/CheckoutForm'
import { StripeSetupProvider } from '@/components/StripeSetupProvider'
import { TranslatedBookingSummary } from '@/components/TranslatedBookingSummary'
import { getCancellationPolicyExperienceIntro } from '@/lib/availability'
import { PAYMENT_MODES } from '@traverum/shared'
import type { Experience, ExperienceSession } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface CheckoutPageProps {
  searchParams: Promise<{
    experienceId?: string
    sessionId?: string
    participants?: string
    total?: string
    isRequest?: string
    requestDate?: string
    requestTime?: string
    preferredLanguage?: string
    rentalDays?: string
    quantity?: string
  }>
}

export default async function DirectCheckoutPage({ searchParams }: CheckoutPageProps) {
  const search = await searchParams

  const experienceId = search.experienceId
  const participantsStr = search.participants
  const totalStr = search.total

  if (!experienceId || !participantsStr || !totalStr) {
    redirect('/experiences')
  }

  const supabase = createAdminClient()

  const { data: experienceData } = await supabase
    .from('experiences')
    .select('*, supplier:partners!experiences_partner_fk(payment_mode)')
    .eq('id', experienceId)
    .single()

  if (!experienceData) {
    notFound()
  }

  const experience = experienceData as Experience
  const supplierPaymentMode = (experienceData as any)?.supplier?.payment_mode || PAYMENT_MODES.PAY_ON_SITE
  const cancellationPolicy = (experience as any).cancellation_policy

  let session: ExperienceSession | null = null
  if (search.sessionId) {
    const { data } = await supabase
      .from('experience_sessions')
      .select('*')
      .eq('id', search.sessionId)
      .single()
    session = data as ExperienceSession | null
  }

  const { data: mediaData } = await supabase
    .from('media')
    .select('url')
    .eq('experience_id', experienceId)
    .order('sort_order')
    .limit(1)

  const media = mediaData as { url: string }[] | null
  const coverImage = media?.[0]?.url || experience.image_url

  const participants = parseInt(participantsStr)
  const totalCents = parseInt(totalStr)
  const isRequest = search.isRequest === 'true'
  const showCardGuarantee = supplierPaymentMode === PAYMENT_MODES.PAY_ON_SITE && !isRequest
  const cancellationPolicyText = getCancellationPolicyExperienceIntro(cancellationPolicy)

  const sessionDate = session?.session_date
  const sessionTime = session?.start_time

  return (
    <>
        <h1 className="text-2xl mb-6 text-heading-foreground">
          {showCardGuarantee ? 'Reserve Your Spot' : isRequest ? 'Complete Your Request' : 'Complete Your Booking'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Summary — shown first on mobile, second on desktop */}
          <div className="order-first lg:order-last lg:col-span-2">
            <TranslatedBookingSummary
              experience={experience}
              session={session}
              participants={participants}
              totalCents={totalCents}
              isRequest={isRequest}
              requestDate={search.requestDate}
              requestTime={search.requestTime}
              coverImage={coverImage}
              rentalDays={search.rentalDays ? parseInt(search.rentalDays) : undefined}
              quantity={search.quantity ? parseInt(search.quantity) : undefined}
              payOnSite={showCardGuarantee}
            />
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-card border border-border p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-5">
                Your details
              </h2>

              {showCardGuarantee ? (
                <StripeSetupProvider>
                  <CheckoutForm
                    experienceId={experience.id}
                    experienceTitle={experience.title}
                    currency={experience.currency}
                    sessionId={search.sessionId}
                    participants={participants}
                    totalCents={totalCents}
                    isRequest={isRequest}
                    requestDate={search.requestDate}
                    requestTime={search.requestTime}
                    sessionDate={sessionDate}
                    sessionTime={sessionTime}
                    preferredLanguage={search.preferredLanguage}
                    rentalDays={search.rentalDays ? parseInt(search.rentalDays) : undefined}
                    quantity={search.quantity ? parseInt(search.quantity) : undefined}
                    paymentMode={supplierPaymentMode}
                    cancellationPolicyText={cancellationPolicyText}
                  />
                </StripeSetupProvider>
              ) : (
                <CheckoutForm
                  experienceId={experience.id}
                  experienceTitle={experience.title}
                  currency={experience.currency}
                  sessionId={search.sessionId}
                  participants={participants}
                  totalCents={totalCents}
                  isRequest={isRequest}
                  requestDate={search.requestDate}
                  requestTime={search.requestTime}
                  sessionDate={sessionDate}
                  sessionTime={sessionTime}
                  preferredLanguage={search.preferredLanguage}
                  rentalDays={search.rentalDays ? parseInt(search.rentalDays) : undefined}
                  quantity={search.quantity ? parseInt(search.quantity) : undefined}
                  paymentMode={supplierPaymentMode}
                  cancellationPolicyText={cancellationPolicyText}
                />
              )}
            </div>
          </div>
        </div>
    </>
  )
}
