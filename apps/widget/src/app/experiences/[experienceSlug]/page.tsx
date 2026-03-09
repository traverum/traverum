import { notFound } from 'next/navigation'
import { getExperienceDirect } from '@/lib/hotels'
import { getAvailableSessions } from '@/lib/sessions'
import { getExperienceAvailability } from '@/lib/availability.server'
import { formatDuration } from '@/lib/utils'
import { getCancellationPolicyExperienceIntro } from '@/lib/availability'
import { getLanguageName } from '@/lib/languages'
import { VeyondHeader } from '@/components/VeyondHeader'
import { ImageGallery } from '@/components/ImageGallery'
import { BookingPanel } from '@/components/BookingPanel'
import { ExperienceDetailClient } from '@/components/ExperienceDetailClient'
import { RichText } from '@/components/RichText'
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

  const [sessions, availabilityRules] = await Promise.all([
    getAvailableSessions(experience.id),
    getExperienceAvailability(experience.id),
  ])

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      <VeyondHeader showBack backTo="/experiences" />

      <main className="container px-4 py-4 md:py-6">
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
                {experience.title}
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
              <RichText
                text={experience.description}
                className="text-foreground mt-3 leading-relaxed font-body"
                style={{ fontSize: 'var(--font-size-body)' }}
              />
            </div>

            {/* Info Sections */}
            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div>
                <h3
                  className="font-body text-heading-foreground"
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  Booking
                </h3>
                <p
                  className="text-muted-foreground mt-0.5"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  Select your preferred date and time and send a request. The provider will respond within 48 hours, and you'll only pay once your request has been approved.
                </p>
              </div>
              <div>
                <h3
                  className="font-body text-heading-foreground"
                  style={{ fontSize: 'var(--font-size-h3)' }}
                >
                  Cancellation
                </h3>
                <p
                  className="text-muted-foreground mt-0.5"
                  style={{ fontSize: 'var(--font-size-sm)' }}
                >
                  {getCancellationPolicyExperienceIntro(experience.cancellation_policy)} You will receive a full refund if the provider cancels due to weather or emergency.
                </p>
              </div>
              {experience.meeting_point && (
                <div>
                  <h3
                    className="font-body text-heading-foreground"
                    style={{ fontSize: 'var(--font-size-h3)' }}
                  >
                    Meeting point
                  </h3>
                  <p
                    className="text-muted-foreground mt-0.5"
                    style={{ fontSize: 'var(--font-size-sm)' }}
                  >
                    {experience.meeting_point}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Panel (Desktop) */}
          <div className="hidden md:block md:col-span-2">
            <div className="sticky top-6">
              <BookingPanel
                experience={experience}
                sessions={sessions}
                hotelSlug="experiences"
                availabilityRules={availabilityRules}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Booking Components */}
      <ExperienceDetailClient
        experience={experience}
        sessions={sessions}
        hotelSlug="experiences"
        availabilityRules={availabilityRules}
      />
    </div>
  )
}
