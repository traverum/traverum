'use client'

import { useMemo, useCallback } from 'react'
import { CategoryAnchorCard } from './CategoryAnchorCard'
import { ScrollRow } from './ScrollRow'
import type { ExperienceWithMedia } from '@/lib/hotels'
import { getCategoryAnchorDisplayLabel, getCategoryAnchorImageSrc } from '@/lib/category-anchor-art'
import { groupExperiencesByTag } from '@/lib/utils'

interface CategoryAnchorSectionProps {
  experiences: ExperienceWithMedia[]
  cardStyle?: 'veyond' | 'hotel'
}

export function CategoryAnchorSection({ experiences, cardStyle = 'veyond' }: CategoryAnchorSectionProps) {
  const sections = useMemo(() => groupExperiencesByTag(experiences), [experiences])

  const scrollToSection = useCallback((tagId: string) => {
    const el = document.getElementById(`tag-${tagId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (sections.length < 2) return null

  return (
    <div className="animate-[fadeInUp_0.4s_ease-out_both]">
      <ScrollRow title="Explore by interest">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex-shrink-0 w-[240px] sm:w-[260px] md:w-[280px] lg:w-[300px] snap-start"
          >
            <CategoryAnchorCard
              label={getCategoryAnchorDisplayLabel(section.id, section.label)}
              imageSrc={getCategoryAnchorImageSrc(section.id)}
              experienceCount={section.experiences.length}
              cardStyle={cardStyle}
              onClick={() => scrollToSection(section.id)}
            />
          </div>
        ))}
      </ScrollRow>
    </div>
  )
}
