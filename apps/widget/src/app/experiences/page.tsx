import { getAllActiveExperiences } from '@/lib/hotels'
import { logAnalyticsEvent } from '@/lib/analytics.server'
import { ExperienceListClient } from '@/components/ExperienceListClient'

export const dynamic = 'force-dynamic'

export default async function ExperiencesBrowsePage() {
  const experiences = await getAllActiveExperiences()

  logAnalyticsEvent({
    event_type: 'widget_view',
    hotel_config_id: null,
    embed_mode: 'standalone',
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-center justify-center text-center py-16 md:py-20 lg:py-24">
        <p className="text-[11px] sm:text-xs font-body font-extralight tracking-[0.35em] uppercase text-muted-foreground mb-3 sm:mb-4">
          Discover
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-heading-foreground tracking-tight leading-[0.95]">
          <span className="font-newyork italic font-light">Lake Maggiore</span>
        </h1>
      </header>

      {experiences.length > 0 ? (
        <ExperienceListClient
          experiences={experiences}
          hotelSlug="experiences"
          embedMode="full"
          cardStyle="veyond"
        />
      ) : (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No experiences available yet.
        </div>
      )}
    </div>
  )
}
