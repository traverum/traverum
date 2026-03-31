'use client'

import { ExperienceCard } from './ExperienceCard'
import { ScrollRow } from './ScrollRow'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'

interface YouMightAlsoLikeProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode?: EmbedMode
  returnUrl?: string | null
  hotelConfigId?: string | null
}

export function YouMightAlsoLike({
  experiences,
  hotelSlug,
  embedMode = 'full',
  returnUrl,
  hotelConfigId,
}: YouMightAlsoLikeProps) {
  if (experiences.length === 0) return null

  return (
    <section className="mt-12 md:mt-16">
      <ScrollRow title="You might also like">
        {experiences.map((experience) => (
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
  )
}
