'use client'

import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ExperienceCard } from './ExperienceCard'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import { EXPERIENCE_CATEGORIES, getCategoryLabel } from '@traverum/shared'

interface NetflixLayoutProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  hotelConfigId?: string | null
}

interface CategorySection {
  id: string
  label: string
  experiences: ExperienceWithMedia[]
}

export function NetflixLayout({
  experiences,
  hotelSlug,
  embedMode,
  returnUrl,
  hotelConfigId,
}: NetflixLayoutProps) {
  const sections = useMemo(() => {
    const result: CategorySection[] = []

    const grouped = new Map<string, ExperienceWithMedia[]>()
    const uncategorized: ExperienceWithMedia[] = []

    for (const exp of experiences) {
      const cat = (exp.tags || [])[0]
      if (cat && EXPERIENCE_CATEGORIES.some(c => c.id === cat)) {
        if (!grouped.has(cat)) grouped.set(cat, [])
        grouped.get(cat)!.push(exp)
      } else {
        uncategorized.push(exp)
      }
    }

    const categoryCount = grouped.size

    result.push({
      id: 'featured',
      label: 'Popular Experiences',
      experiences,
    })

    if (categoryCount >= 2) {
      for (const cat of EXPERIENCE_CATEGORIES) {
        const exps = grouped.get(cat.id)
        if (exps && exps.length > 0) {
          result.push({
            id: cat.id,
            label: getCategoryLabel(cat.id),
            experiences: exps,
          })
        }
      }

      if (uncategorized.length > 0) {
        result.push({
          id: 'more',
          label: 'More to Explore',
          experiences: uncategorized,
        })
      }
    }

    return result
  }, [experiences])

  return (
    <div className="space-y-8 md:space-y-12">
      {sections.map((section, i) => (
        <section
          key={section.id}
          className="animate-[fadeInUp_0.4s_ease-out_both]"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <ScrollRow
            title={section.label}
            experiences={section.experiences}
            hotelSlug={hotelSlug}
            embedMode={embedMode}
            returnUrl={returnUrl}
            hotelConfigId={hotelConfigId}
          />
        </section>
      ))}
    </div>
  )
}

function ScrollRow({
  title,
  experiences,
  hotelSlug,
  embedMode,
  returnUrl,
  hotelConfigId,
}: {
  title: string
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  hotelConfigId?: string | null
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    checkOverflow()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(checkOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkOverflow])

  const scroll = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current
      if (!el) return
      const amount = el.clientWidth * 0.75
      el.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    },
    []
  )

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-heading text-heading-foreground mb-4">
        {title}
      </h2>

      <div className="group/row relative -mx-1">
        {/* Left fade + arrow */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-2 z-10 w-12 md:w-16 flex items-center justify-center',
            'bg-gradient-to-r from-background via-background/60 to-transparent',
            'transition-opacity duration-200',
            canScrollLeft
              ? 'opacity-0 group-hover/row:opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
        >
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-card transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" aria-hidden />
          </button>
        </div>

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={checkOverflow}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {experiences.map((experience) => (
            <div
              key={experience.id}
              className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-[260px] lg:w-[280px] snap-start transition-transform duration-200 hover:scale-[1.03] hover:z-10"
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
        </div>

        {/* Right fade + arrow */}
        <div
          className={cn(
            'absolute right-0 top-0 bottom-2 z-10 w-12 md:w-16 flex items-center justify-center',
            'bg-gradient-to-l from-background via-background/60 to-transparent',
            'transition-opacity duration-200',
            canScrollRight
              ? 'opacity-0 group-hover/row:opacity-100'
              : 'opacity-0 pointer-events-none'
          )}
        >
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-card transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
