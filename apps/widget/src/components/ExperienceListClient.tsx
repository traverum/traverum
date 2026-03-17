'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExperienceCard } from './ExperienceCard'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import { EXPERIENCE_CATEGORIES, getCategoryLabel, getCategoryIcon } from '@traverum/shared'

interface ExperienceListClientProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  /** Use 'veyond' card style (portrait, duration badge, location, from price) when on /experiences */
  cardStyle?: 'default' | 'veyond'
  hotelConfigId?: string | null
}

export function ExperienceListClient({ experiences, hotelSlug, embedMode, returnUrl, cardStyle, hotelConfigId }: ExperienceListClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Extract unique categories from all experiences (first tag element is the category)
  const uniqueCategories = useMemo(() => {
    const allCategories = experiences
      .map(e => (e.tags || [])[0]) // First tag is the category
      .filter((cat): cat is string => !!cat && cat.trim().length > 0)
    return Array.from(new Set(allCategories))
      .filter(cat => EXPERIENCE_CATEGORIES.some(c => c.id === cat)) // Only show valid categories
      .sort((a, b) => {
        // Sort by category order in EXPERIENCE_CATEGORIES
        const indexA = EXPERIENCE_CATEGORIES.findIndex(c => c.id === a)
        const indexB = EXPERIENCE_CATEGORIES.findIndex(c => c.id === b)
        return indexA - indexB
      })
  }, [experiences])

  // Filter experiences based on active category
  const filteredExperiences = useMemo(() => {
    if (activeCategory === null) return experiences
    return experiences.filter(e => (e.tags || [])[0] === activeCategory)
  }, [experiences, activeCategory])

  return (
    <>
      {/* Category filter - editorial style on /experiences (veyond), else pill tabs */}
      {embedMode === 'full' && uniqueCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cardStyle === 'veyond' ? 'mb-10' : 'mb-6'}
        >
          {cardStyle === 'veyond' ? (
            <div className="flex flex-nowrap sm:flex-wrap items-center justify-center sm:justify-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'relative flex-shrink-0 min-h-[44px] py-2.5 px-5 text-[13px] font-body font-light tracking-[0.08em] rounded-full transition-colors whitespace-nowrap inline-flex items-center justify-center',
                  activeCategory === null ? 'text-heading-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activeCategory === null && (
                  <motion.span
                    layoutId="category-bubble"
                    className="absolute inset-0 rounded-full bg-heading-foreground/12 border border-heading-foreground/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">All</span>
              </button>
              {uniqueCategories.map(categoryId => (
                <button
                  key={categoryId}
                  onClick={() => setActiveCategory(categoryId)}
                  className={cn(
                    'relative flex-shrink-0 min-h-[44px] py-2.5 px-5 text-[13px] font-body font-light tracking-[0.08em] rounded-full transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2',
                    activeCategory === categoryId ? 'text-heading-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {activeCategory === categoryId && (
                    <motion.span
                      layoutId="category-bubble"
                      className="absolute inset-0 rounded-full bg-heading-foreground/12 border border-heading-foreground/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 opacity-80">{getCategoryIcon(categoryId)}</span>
                  <span className="relative z-10">{getCategoryLabel(categoryId)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex bg-muted rounded-2xl p-1 gap-0 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'flex-shrink-0 px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap',
                  activeCategory === null
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              {uniqueCategories.map(categoryId => (
                <button
                  key={categoryId}
                  onClick={() => setActiveCategory(categoryId)}
                  className={cn(
                    'flex-shrink-0 px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap flex items-center gap-1.5',
                    activeCategory === categoryId
                      ? 'bg-card text-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{getCategoryIcon(categoryId)}</span>
                  <span>{getCategoryLabel(categoryId)}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Experience grid - visible on first paint to avoid stuck opacity:0 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory || 'all'}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'grid gap-4 md:gap-6',
            embedMode === 'full' 
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {filteredExperiences.length > 0 ? (
            filteredExperiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ExperienceCard
                  experience={experience}
                  hotelSlug={hotelSlug}
                  embedMode={embedMode}
                  returnUrl={returnUrl}
                  cardStyle={cardStyle}
                  hotelConfigId={hotelConfigId}
                />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                No experiences in this category
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}