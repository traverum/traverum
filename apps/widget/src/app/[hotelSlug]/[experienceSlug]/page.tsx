import { notFound } from 'next/navigation'
import { getHotelBySlug, getExperienceForHotel, getHotelWithExperiences } from '@/lib/hotels'
import { getAvailableSessions } from '@/lib/sessions'
import { getExperienceAvailability } from '@/lib/availability.server'
import { getEmbedMode, formatDuration, cn } from '@/lib/utils'
import { logAnalyticsEvent, parseSource } from '@/lib/analytics.server'
import { getLanguageName } from '@/lib/languages'
import { Header } from '@/components/Header'
import { EmbedResizer } from '@/components/EmbedResizer'
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
import { PostHogHotelContext } from '@/components/PostHogHotelContext'
import { PostHogExperienceViewed } from '@/components/PostHogExperienceViewed'
import type { Metadata } from 'next'

// Force dynamic rendering so hotel config changes take effect immediately
export const dynamic = 'force-dynamic'

interface ExperiencePageProps {
  params: Promise<{ hotelSlug: string; experienceSlug: string }>
  searchParams: Promise<{ embed?: string; returnUrl?: string; source?: string }>
}

export async function generateMetadata({ params }: ExperiencePageProps): Promise<Metadata> {
  const { hotelSlug, experienceSlug } = await params
  const experience = await getExperienceForHotel(hotelSlug, experienceSlug)
  const hotel = await getHotelBySlug(hotelSlug)
  
  if (!experience || !hotel) {
    return { title: 'Experience Not Found' }
  }
  
  return {
    title: `${experience.title} - ${hotel.display_name}`,
    description: experience.description.slice(0, 160),
  }
}

export default async function ExperiencePage({ params, searchParams }: ExperiencePageProps) {
  const { hotelSlug, experienceSlug } = await params
  const search = await searchParams
  const embedMode = getEmbedMode(search)
  const returnUrl = search.returnUrl
  
  const [hotel, experience] = await Promise.all([
    getHotelBySlug(hotelSlug),
    getExperienceForHotel(hotelSlug, experienceSlug),
  ])
  
  if (!hotel || !experience) {
    notFound()
  }

  logAnalyticsEvent({
    event_type: 'experience_details',
    hotel_config_id: hotel.id,
    experience_id: experience.id,
    source: parseSource(search.source),
    embed_mode: embedMode === 'section' ? 'section' : 'full',
  })
  
  const [sessions, availabilityRules, hotelData] = await Promise.all([
    getAvailableSessions(experience.id),
    getExperienceAvailability(experience.id),
    getHotelWithExperiences(hotelSlug),
  ])

  const siblingExperiences = sortByTagRelevance(
    experience,
    (hotelData?.experiences ?? []).filter((e) => e.id !== experience.id)
  )
  
  return (
    <div className={cn(
      embedMode === 'full' ? 'embed-full' : 'embed-section',
      'min-h-screen pb-20 md:pb-0'
    )}>
      {/* Header - only in full mode */}
      {embedMode === 'full' && (
        <Header 
          hotelName={hotel.display_name}
          logoUrl={hotel.logo_url}
          hotelSlug={hotelSlug}
          showBack={true}
          backTo={returnUrl ? `/${hotelSlug}?returnUrl=${encodeURIComponent(returnUrl)}` : `/${hotelSlug}`}
          returnUrl={returnUrl}
          websiteUrl={hotel.website_url}
        />
      )}
      
      <main className="container px-4 py-4 md:py-6">
        <BookingFlowProvider
          experience={experience}
          sessions={sessions}
          availabilityRules={availabilityRules}
          hotelSlug={hotelSlug}
          returnUrl={returnUrl}
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
                    <> · {experience.available_languages.map(code => getLanguageName(code)).join(', ')}</>
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
                            <TranslatedText experienceId={experience.id} field="meetingPoint" fallback={experience.meeting_point ?? ''} />
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
                  allowsRequests: experience.allows_requests ?? false,
                  isRental: experience.pricing_type === 'per_day',
                })}
                paymentText={buildPaymentText({
                  paymentMode: experience.supplier.payment_mode,
                  isRental: experience.pricing_type === 'per_day',
                })}
                cancellationText={buildExperienceCancellationSummary(experience.cancellation_policy, experience.supplier.payment_mode)}
              />
            </div>

            {/* Right Column — sticky booking card (desktop), top offset clears the sticky header (h-16 = 4rem + 1.5rem gap) */}
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-[5.5rem] z-10">
                <StickyBookingCard />
              </div>
            </div>
          </div>
        </BookingFlowProvider>
      </main>

      {siblingExperiences.length > 0 && (
        <div className="container px-4">
          <YouMightAlsoLike
            experiences={siblingExperiences}
            hotelSlug={hotelSlug}
            embedMode={embedMode}
            returnUrl={returnUrl}
            hotelConfigId={hotel.id}
          />
        </div>
      )}

      {/* Mobile booking bar + sheet */}
      <ExperienceDetailClient
        experience={experience}
        sessions={sessions}
        hotelSlug={hotelSlug}
        availabilityRules={availabilityRules}
        returnUrl={returnUrl}
      />
      
      <PostHogHotelContext
        hotelConfigId={hotel.id}
        hotelSlug={hotelSlug}
        hotelName={hotel.display_name}
        channel="white-label"
      />
      <PostHogExperienceViewed
        experienceId={experience.id}
        experienceTitle={experience.title}
        supplierId={experience.partner_id}
      />

      {/* Embed mode resize (client-only, after hydration) */}
      {embedMode === 'section' && <EmbedResizer />}
    </div>
  )
}