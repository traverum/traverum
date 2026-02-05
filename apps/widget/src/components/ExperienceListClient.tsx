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
}

export function ExperienceListClient({ experiences, hotelSlug, embedMode }: ExperienceListClientProps) {
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
      {/* Category tabs - only show in full mode when there are categories */}
      {embedMode === 'full' && uniqueCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {/* "All" tab */}
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap',
                activeCategory === null
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All
            </button>
            {/* Category tabs */}
            {uniqueCategories.map(categoryId => (
              <button
                key={categoryId}
                onClick={() => setActiveCategory(categoryId)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-1.5',
                  activeCategory === categoryId
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <span>{getCategoryIcon(categoryId)}</span>
                <span>{getCategoryLabel(categoryId)}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Experience grid with animated transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory || 'all'}
          initial={{ opacity: 0 }}
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