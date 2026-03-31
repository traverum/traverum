'use client'

import { useMemo } from 'react'
import { ExperienceCard } from './ExperienceCard'
import { ScrollRow } from './ScrollRow'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import { groupExperiencesByTag } from '@/lib/utils'

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
  const sections = useMemo(() => groupExperiencesByTag(experiences), [experiences])

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
            {section.experiences.map((experience) => (
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
                />
              </div>
            ))}
          </ScrollRow>
        </section>
      ))}
    </div>
  )
}
