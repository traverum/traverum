'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExperienceCard } from './ExperienceCard'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'

interface ExperienceListClientProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
}

export function ExperienceListClient({ experiences, hotelSlug, embedMode }: ExperienceListClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Extract unique tags from all experiences, sorted alphabetically
  const uniqueTags = useMemo(() => {
    const allTags = experiences
      .flatMap(e => e.tags || [])
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    return Array.from(new Set(allTags)).sort()
  }, [experiences])

  // Filter experiences based on active tag
  const filteredExperiences = useMemo(() => {
    if (activeTag === null) return experiences
    return experiences.filter(e => (e.tags || []).includes(activeTag))
  }, [experiences, activeTag])

  return (
    <>
      {/* Tag tabs - only show in full mode when there are tags */}
      {embedMode === 'full' && uniqueTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {/* "All" tab */}
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap',
                activeTag === null
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All
            </button>
            {/* Tag tabs */}
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap',
                  activeTag === tag
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Experience grid with animated transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTag || 'all'}
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