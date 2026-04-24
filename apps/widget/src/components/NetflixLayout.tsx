'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExperienceCard } from './ExperienceCard'
import { ScrollRow } from './ScrollRow'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import { groupExperiencesByTag, shuffleWithSeed } from '@/lib/utils'
import { getAnalyticsSessionId, initAnalyticsSession } from '@/lib/analytics.client'

interface NetflixLayoutProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  hotelConfigId?: string | null
}

export function NetflixLayout({
  experiences,
  hotelSlug,
  embedMode,
  returnUrl,
  hotelConfigId,
}: NetflixLayoutProps) {
  // Null on SSR ⇒ first paint uses the server order (no hydration mismatch).
  // After mount we read/create the session id and re-render with the shuffled
  // list, so the order is stable within a session and varies across sessions.
  const [shuffleSeed, setShuffleSeed] = useState<string | null>(null)

  useEffect(() => {
    let sid = getAnalyticsSessionId()
    if (!sid) {
      initAnalyticsSession(null)
      sid = getAnalyticsSessionId()
    }
    if (sid) setShuffleSeed(sid)
  }, [])

  const orderedExperiences = useMemo(
    () => (shuffleSeed ? shuffleWithSeed(experiences, shuffleSeed) : experiences),
    [experiences, shuffleSeed]
  )

  const sections = useMemo(
    () => groupExperiencesByTag(orderedExperiences),
    [orderedExperiences]
  )

  return (
    <div className="space-y-8 md:space-y-12">
      {sections.map((section, i) => (
        <section
          key={section.id}
          id={`tag-${section.id}`}
          className="animate-[fadeInUp_0.4s_ease-out_both] scroll-mt-24"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <ScrollRow title={section.label}>
            {section.experiences.map((experience, cardIndex) => (
              <div
                key={experience.id}
                className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[280px] snap-start"
              >
                <ExperienceCard
                  experience={experience}
                  hotelSlug={hotelSlug}
                  embedMode={embedMode}
                  returnUrl={returnUrl}
                  cardStyle="veyond"
                  hotelConfigId={hotelConfigId}
                  positionInSection={cardIndex}
                  sectionId={section.id}
                  totalInSection={section.experiences.length}
                />
              </div>
            ))}
          </ScrollRow>
        </section>
      ))}
    </div>
  )
}
