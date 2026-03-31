import type { ExperienceWithMedia } from '@/lib/hotels'

/**
 * Returns experiences that share at least one tag with the current
 * experience, sorted by tag overlap (most shared first).
 */
export function sortByTagRelevance(
  current: ExperienceWithMedia,
  others: ExperienceWithMedia[]
): ExperienceWithMedia[] {
  const currentTags = new Set(current.tags || [])
  if (currentTags.size === 0) return []

  const withOverlap = others
    .map((exp) => ({
      exp,
      overlap: (exp.tags || []).filter((t) => currentTags.has(t)).length,
    }))
    .filter((entry) => entry.overlap > 0)

  withOverlap.sort((a, b) => b.overlap - a.overlap)
  return withOverlap.map((entry) => entry.exp)
}
