import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { VeyondHeader } from '@/components/VeyondHeader'
import { CheckoutForm } from '@/components/CheckoutForm'
import { TranslatedBookingSummary } from '@/components/TranslatedBookingSummary'
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
    .select('*')
    .eq('id', experienceId)
    .single()

  if (!experienceData) {
    notFound()
  }

  const experience = experienceData as Experience

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

  const sessionDate = session?.session_date
  const sessionTime = session?.start_time

  return (
    <div className="min-h-screen bg-background">
      <VeyondHeader showBack backTo={`/experiences/${experience.slug}`} />

      <main className="container px-4 py-6">
        <Link
          href={`/experiences/${experience.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to experience
        </Link>

        <h1 className="text-2xl mb-6 text-heading-foreground">
          {isRequest ? 'Complete Your Request' : 'Complete Your Booking'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-card border border-border p-6">
              <h2 className="text-lg font-body text-card-foreground mb-5">
                Guest Details
              </h2>

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
              />
            </div>
          </div>

          <div className="lg:col-span-2">
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
            />
          </div>
        </div>
      </main>
    </div>
  )
}
