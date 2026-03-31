import { notFound } from 'next/navigation'
import { getExperienceDirect, getAllActiveExperiences } from '@/lib/hotels'
import { getAvailableSessions } from '@/lib/sessions'
import { getExperienceAvailability } from '@/lib/availability.server'
import { logAnalyticsEvent } from '@/lib/analytics.server'
import { formatDuration } from '@/lib/utils'
import { getLanguageName } from '@/lib/languages'
import { ImageGallery } from '@/components/ImageGallery'
import { BookingFlowProvider } from '@/components/BookingFlowContext'
import { StickyBookingCard } from '@/components/StickyBookingCard'
import { AvailabilityResults } from '@/components/AvailabilityResults'
import { ExperienceDetailClient } from '@/components/ExperienceDetailClient'
import { ExperienceInfoTabs } from '@/components/ExperienceInfoTabs'
import { YouMightAlsoLike } from '@/components/YouMightAlsoLike'
import { TranslatedText } from '@/components/TranslatedText'
import { TranslatedRichText } from '@/components/TranslatedRichText'
import {
  buildHowItWorksText,
  buildPaymentText,
  buildExperienceCancellationSummary,
} from '@/lib/experience-detail-copy'
import { parseLatLng } from '@/lib/geo'
import { LocationMap } from '@/components/LocationMap'
import { sortByTagRelevance } from '@/lib/experience-relevance'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface ExperiencePageProps {
  params: Promise<{ experienceSlug: string }>
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { experienceSlug } = await params
  const experience = await getExperienceDirect(experienceSlug)

  if (!experience) {
    return { title: 'Experience Not Found' }
  }

  return {
    title: experience.title,
    description: experience.description.slice(0, 160),
  }
}

export default async function ExperienceDirectPage({ params }: ExperiencePageProps) {
  const { experienceSlug } = await params

  const experience = await getExperienceDirect(experienceSlug)

  if (!experience) {
    notFound()
  }

  logAnalyticsEvent({
    event_type: 'experience_details',
    hotel_config_id: null,
    experience_id: experience.id,
    embed_mode: 'standalone',
  })

  const [sessions, availabilityRules, allExperiences] = await Promise.all([
    getAvailableSessions(experience.id),
    getExperienceAvailability(experience.id),
    getAllActiveExperiences(),
  ])

  const siblingExperiences = sortByTagRelevance(
    experience,
    allExperiences.filter((e) => e.id !== experience.id)
  )

  return (
    <div className="pb-20 md:pb-0">
      <BookingFlowProvider
        experience={experience}
        sessions={sessions}
        availabilityRules={availabilityRules}
        hotelSlug="experiences"
      >
        <div className="md:grid md:grid-cols-5 md:gap-6">
          {/* Left Column - Content */}
          <div className="md:col-span-3">
            <ImageGallery
              images={experience.media}
              fallbackImage={experience.image_url}
              title={experience.title}
            />

            <div className="mt-5">
              <h1
                className="font-heading text-heading-foreground"
                style={{ fontSize: 'var(--font-size-h1)' }}
              >
                <TranslatedText experienceId={experience.id} field="title" fallback={experience.title} />
              </h1>
              <p
                className="text-muted-foreground mt-1"
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                {formatDuration(experience.duration_minutes)} · Up to {experience.max_participants} {experience.pricing_type === 'per_day' ? (experience.max_participants === 1 ? 'unit' : 'units') : 'people'}
                {experience.available_languages && experience.available_languages.length > 0 && (
                  <> · {experience.available_languages.map((code: string) => getLanguageName(code)).join(', ')}</>
                )}
              </p>
            </div>

            <ExperienceInfoTabs
              description={
                <TranslatedRichText
                  experienceId={experience.id}
                  fallbackText={experience.description}
                  className="text-foreground leading-relaxed font-body"
                  style={{ fontSize: 'var(--font-size-body)' }}
                />
              }
              location={(() => {
                const coords = parseLatLng(experience.location)
                const hasMap = !!coords
                const hasMeetingPoint = !!experience.meeting_point
                if (!hasMap && !hasMeetingPoint) return undefined
                return (
                  <>
                    <h2
                      className="font-body text-heading-foreground"
                      style={{ fontSize: 'var(--font-size-h3)' }}
                    >
                      {hasMap ? 'Location' : 'Meeting point'}
                    </h2>
                    {coords && (
                      <div className="mt-3">
                        <LocationMap lat={coords.lat} lng={coords.lng} />
                      </div>
                    )}
                    {hasMeetingPoint && (
                      <div className={hasMap ? 'mt-4' : 'mt-1.5'}>
                        {hasMap && (
                          <p
                            className="font-body text-heading-foreground mb-1"
                            style={{ fontSize: 'var(--font-size-sm)' }}
                          >
                            Meeting point
                          </p>
                        )}
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 'var(--font-size-sm)' }}
                        >
                          <TranslatedText experienceId={experience.id} field="meetingPoint" fallback={experience.meeting_point} />
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
              bookingSection={<AvailabilityResults />}
              howItWorksText={buildHowItWorksText({
                paymentMode: experience.supplier.payment_mode,
                hasSessions: sessions.length > 0,
                allowsRequests: experience.allows_requests,
                isRental: experience.pricing_type === 'per_day',
              })}
              paymentText={buildPaymentText({
                paymentMode: experience.supplier.payment_mode,
                isRental: experience.pricing_type === 'per_day',
              })}
              cancellationText={buildExperienceCancellationSummary(experience.cancellation_policy)}
            />
          </div>

          {/* Right Column — sticky booking card (desktop) */}
          <div className="hidden md:block md:col-span-2">
            <div className="sticky top-6 z-10">
              <StickyBookingCard />
            </div>
          </div>
        </div>
      </BookingFlowProvider>

      {siblingExperiences.length > 0 && (
        <YouMightAlsoLike
          experiences={siblingExperiences}
          hotelSlug="experiences"
          hotelConfigId={null}
        />
      )}

      {/* Mobile booking bar + sheet */}
      <ExperienceDetailClient
        experience={experience}
        sessions={sessions}
        hotelSlug="experiences"
        availabilityRules={availabilityRules}
      />
    </div>
  )
}
