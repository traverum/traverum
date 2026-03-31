import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getHotelBySlug } from '@/lib/hotels'
import { getCancellationPolicyExperienceIntro } from '@/lib/availability'
import { Header } from '@/components/Header'
import { StripeSetupProvider } from '@/components/StripeSetupProvider'
import { GuaranteeForm } from '@/components/GuaranteeForm'
import { BookingSummary } from '@/components/BookingSummary'
import { PAYMENT_MODES } from '@traverum/shared'
import type { Experience, ExperienceSession } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface GuaranteePageProps {
  params: Promise<{ hotelSlug: string; id: string }>
  searchParams: Promise<{ returnUrl?: string }>
}

export default async function GuaranteePage({ params, searchParams }: GuaranteePageProps) {
  const { hotelSlug, id } = await params
  const search = await searchParams
  const returnUrl = search.returnUrl

  const hotel = await getHotelBySlug(hotelSlug)
  if (!hotel) notFound()

  const supabase = createAdminClient()

  const { data: reservationData } = await supabase
    .from('reservations')
    .select(`
      *,
      experience:experiences(
        *,
        supplier:partners!experiences_partner_fk(payment_mode)
      ),
      session:experience_sessions(*)
    `)
    .eq('id', id)
    .single()

  if (!reservationData) notFound()

  const reservation = reservationData as any
  const experience = reservation.experience as Experience
  const supplier = (reservation.experience as any)?.supplier
  const session = reservation.session as ExperienceSession | null

  if (!experience || !supplier) notFound()

  const supplierPaymentMode = supplier.payment_mode || PAYMENT_MODES.PAY_ON_SITE
  if (reservation.reservation_status !== 'approved' || supplierPaymentMode !== PAYMENT_MODES.PAY_ON_SITE) {
    notFound()
  }

  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('reservation_id', id)
    .single()

  if (existingBooking) notFound()

  const { data: mediaData } = await supabase
    .from('media')
    .select('url')
    .eq('experience_id', experience.id)
    .order('sort_order')
    .limit(1)

  const coverImage = (mediaData as { url: string }[] | null)?.[0]?.url || (experience as any).image_url

  const cancellationPolicyText = getCancellationPolicyExperienceIntro(
    (experience as any).cancellation_policy
  )

  const backTo = returnUrl
    ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}`
    : `/${hotelSlug}`

  return (
    <div className="embed-full">
      <Header
        hotelName={hotel.display_name}
        logoUrl={hotel.logo_url}
        hotelSlug={hotelSlug}
        showBack={true}
        backTo={backTo}
        returnUrl={returnUrl}
        websiteUrl={hotel.website_url}
      />

      <main className="container px-4 py-6">
        <h1 className="text-2xl text-heading-foreground mb-6">
          Confirm Your Reservation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Summary — shown first on mobile, second on desktop */}
          <div className="order-first lg:order-last lg:col-span-2">
            <BookingSummary
              experience={experience}
              session={session}
              participants={reservation.participants}
              totalCents={reservation.total_cents}
              isRequest={false}
              requestDate={reservation.requested_date}
              requestTime={reservation.requested_time}
              coverImage={coverImage}
              payOnSite={true}
            />
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-card border border-border p-6">
              <StripeSetupProvider>
                <GuaranteeForm
                  reservationId={id}
                  basePath={`/${hotelSlug}`}
                  cancellationPolicyText={cancellationPolicyText}
                  returnUrl={returnUrl}
                />
              </StripeSetupProvider>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
