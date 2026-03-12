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
    <div className="min-h-screen bg-background">
      <main className="px-4">
        {/* Hero */}
        <header className="container mx-auto text-center py-16 md:py-24 lg:py-28">
          <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-heading-foreground tracking-tight py-6 md:py-8">
            Veyond
          </h1>
          <p className="font-heading text-muted-foreground text-xl md:text-2xl lg:text-3xl mt-2 md:mt-3">
            Experience Northern Italy
          </p>
        </header>

        <div className="container px-0 pb-6">
          {experiences.length > 0 ? (
            <ExperienceListClient
              experiences={experiences}
              hotelSlug="experiences"
              embedMode="full"
              cardStyle="veyond"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No experiences available yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
