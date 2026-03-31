'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExperienceCard } from './ExperienceCard'
import { cn } from '@/lib/utils'
import type { ExperienceWithMedia } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import { EXPERIENCE_TAGS, getTagLabel } from '@traverum/shared'

interface ExperienceListClientProps {
  experiences: ExperienceWithMedia[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  cardStyle?: 'default' | 'veyond'
  hotelConfigId?: string | null
}

export function ExperienceListClient({ experiences, hotelSlug, embedMode, returnUrl, cardStyle, hotelConfigId }: ExperienceListClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const uniqueTags = useMemo(() => {
    const allTags = experiences.flatMap(e => e.tags || [])
    return Array.from(new Set(allTags))
      .filter(tag => EXPERIENCE_TAGS.some(t => t.id === tag))
      .sort((a, b) => {
        const indexA = EXPERIENCE_TAGS.findIndex(t => t.id === a)
        const indexB = EXPERIENCE_TAGS.findIndex(t => t.id === b)
        return indexA - indexB
      })
  }, [experiences])

  const filteredExperiences = useMemo(() => {
    if (activeTag === null) return experiences
    return experiences.filter(e => (e.tags || []).includes(activeTag))
  }, [experiences, activeTag])

  return (
    <>
      {embedMode === 'full' && uniqueTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cardStyle === 'veyond' ? 'mb-10' : 'mb-6'}
        >
          {cardStyle === 'veyond' ? (
            <div className="flex flex-nowrap sm:flex-wrap items-center justify-center sm:justify-center gap-2 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTag(null)}
                className={cn(
                  'relative flex-shrink-0 min-h-[44px] py-2.5 px-5 text-[13px] font-body font-light tracking-[0.08em] rounded-full transition-colors whitespace-nowrap inline-flex items-center justify-center',
                  activeTag === null ? 'text-heading-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activeTag === null && (
                  <motion.span
                    layoutId="tag-bubble"
                    className="absolute inset-0 rounded-full bg-heading-foreground/12 border border-heading-foreground/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">All</span>
              </button>
              {uniqueTags.map(tagId => (
                <button
                  key={tagId}
                  onClick={() => setActiveTag(tagId)}
                  className={cn(
                    'relative flex-shrink-0 min-h-[44px] py-2.5 px-5 text-[13px] font-body font-light tracking-[0.08em] rounded-full transition-colors whitespace-nowrap inline-flex items-center justify-center',
                    activeTag === tagId ? 'text-heading-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {activeTag === tagId && (
                    <motion.span
                      layoutId="tag-bubble"
                      className="absolute inset-0 rounded-full bg-heading-foreground/12 border border-heading-foreground/20"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{getTagLabel(tagId)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex bg-muted rounded-2xl p-1 gap-0 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTag(null)}
                className={cn(
                  'flex-shrink-0 px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap',
                  activeTag === null
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              {uniqueTags.map(tagId => (
                <button
                  key={tagId}
                  onClick={() => setActiveTag(tagId)}
                  className={cn(
                    'flex-shrink-0 px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap',
                    activeTag === tagId
                      ? 'bg-card text-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {getTagLabel(tagId)}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTag || 'all'}
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
                No experiences with this tag
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
