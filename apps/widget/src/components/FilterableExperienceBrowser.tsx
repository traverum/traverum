'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SearchFilterBar, EMPTY_FILTERS } from './SearchFilterBar'
import { NetflixLayout } from './NetflixLayout'
import { ExperienceCard } from './ExperienceCard'
import { YouMightAlsoLike } from './YouMightAlsoLike'
import { EXPERIENCE_TAGS, getTagLabel } from '@traverum/shared'
import type { ExperienceWithMedia, SessionCalendarEntry } from '@/lib/hotels'
import type { EmbedMode } from '@/lib/utils'
import type { FilterState, TimeBucket } from './SearchFilterBar'

interface FilterableExperienceBrowserProps {
  experiences: ExperienceWithMedia[]
  sessionCalendar: SessionCalendarEntry[]
  hotelSlug: string
  embedMode: EmbedMode
  returnUrl?: string | null
  hotelConfigId?: string | null
}

function matchesTimeBucket(startTime: string, bucket: TimeBucket): boolean {
  const hour = parseInt(startTime.split(':')[0], 10)
  if (isNaN(hour)) return false
  switch (bucket) {
    case 'morning':
      return hour < 12
    case 'afternoon':
      return hour >= 12 && hour < 17
    case 'evening':
      return hour >= 17
  }
}

function matchesSearch(
  experience: ExperienceWithMedia,
  query: string
): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true

  if (experience.title.toLowerCase().includes(q)) return true

  const tags = experience.tags || []
  for (const tagId of tags) {
    const label = getTagLabel(tagId)
    if (label.toLowerCase().includes(q)) return true
  }

  return false
}

export function FilterableExperienceBrowser({
  experiences,
  sessionCalendar,
  hotelSlug,
  embedMode,
  returnUrl,
  hotelConfigId,
}: FilterableExperienceBrowserProps) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS })

  const hasActiveFilters =
    filters.search !== '' ||
    filters.tag !== null ||
    filters.date !== null ||
    filters.timeBucket !== null ||
    filters.people !== null

  const availableTags = useMemo(() => {
    const allTags = experiences.flatMap((e) => e.tags || [])
    return Array.from(new Set(allTags))
      .filter((tag) => EXPERIENCE_TAGS.some((t) => t.id === tag))
      .sort((a, b) => {
        const indexA = EXPERIENCE_TAGS.findIndex((t) => t.id === a)
        const indexB = EXPERIENCE_TAGS.findIndex((t) => t.id === b)
        return indexA - indexB
      })
  }, [experiences])

  // Index sessions by experience_id for fast lookup
  const sessionsByExperience = useMemo(() => {
    const map = new Map<string, SessionCalendarEntry[]>()
    for (const entry of sessionCalendar) {
      const arr = map.get(entry.experience_id)
      if (arr) {
        arr.push(entry)
      } else {
        map.set(entry.experience_id, [entry])
      }
    }
    return map
  }, [sessionCalendar])

  const filteredExperiences = useMemo(() => {
    return experiences.filter((exp) => {
      // Text search — applies to all experiences
      if (!matchesSearch(exp, filters.search)) return false

      // Tag filter — applies to all experiences
      if (filters.tag && !(exp.tags || []).includes(filters.tag)) return false

      // People filter — applies to all experiences
      if (filters.people !== null) {
        if (filters.people < exp.min_participants) return false
        if (filters.people > exp.max_participants) return false
      }

      const isRequestBased = exp.allows_requests === true

      // Date/time filters — request-based experiences always pass
      if (isRequestBased) return true

      const sessions = sessionsByExperience.get(exp.id) || []

      // If date or time filters are active, session-based experiences
      // must have at least one matching session
      if (filters.date || filters.timeBucket) {
        const hasMatchingSession = sessions.some((s) => {
          if (filters.date && s.session_date !== filters.date) return false
          if (filters.timeBucket && !matchesTimeBucket(s.start_time, filters.timeBucket))
            return false
          return true
        })
        if (!hasMatchingSession) return false
      }

      return true
    })
  }, [experiences, filters, sessionsByExperience])

  const SUGGESTION_THRESHOLD = 3
  const otherExperiences = useMemo(() => {
    if (!hasActiveFilters) return []
    if (filteredExperiences.length > SUGGESTION_THRESHOLD) return []
    const filteredIds = new Set(filteredExperiences.map((e) => e.id))
    return experiences.filter((e) => !filteredIds.has(e.id))
  }, [experiences, filteredExperiences, hasActiveFilters])

  // Track which request-based experiences are shown alongside date/time-filtered results
  const dateTimeFiltersActive = filters.date !== null || filters.timeBucket !== null

  return (
    <div className="space-y-6">
      <SearchFilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      <AnimatePresence mode="wait">
        {hasActiveFilters ? (
          <motion.div
            key="filtered-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Result count */}
            <p className="text-sm font-body text-muted-foreground mb-6">
              {filteredExperiences.length === 0
                ? 'No experiences match your filters'
                : `${filteredExperiences.length} experience${filteredExperiences.length === 1 ? '' : 's'} found`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredExperiences.map((experience, index) => (
                <motion.div
                  key={experience.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <ExperienceCard
                    experience={experience}
                    hotelSlug={hotelSlug}
                    embedMode={embedMode}
                    returnUrl={returnUrl}
                    cardStyle="veyond"
                    hotelConfigId={hotelConfigId}
                    showRequestBadge={
                      dateTimeFiltersActive && experience.allows_requests === true
                    }
                  />
                </motion.div>
              ))}
            </div>

            {otherExperiences.length > 0 && (
              <YouMightAlsoLike
                experiences={otherExperiences}
                hotelSlug={hotelSlug}
                embedMode={embedMode}
                returnUrl={returnUrl}
                hotelConfigId={hotelConfigId}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="netflix-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <NetflixLayout
              experiences={experiences}
              hotelSlug={hotelSlug}
              embedMode={embedMode}
              returnUrl={returnUrl}
              hotelConfigId={hotelConfigId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
