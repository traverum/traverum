import { EXPERIENCE_TAGS } from '@traverum/shared'

const BASE = '/category-anchors'

const KNOWN_IDS = new Set<string>([
  ...EXPERIENCE_TAGS.map(t => t.id),
  'more',
])

/**
 * Global art for category anchor cards (wayfinding, not product photography).
 * Files live in `public/category-anchors/`. Replace SVGs with JPG/WebP anytime
 * by changing extensions here and adding assets.
 */
export function getCategoryAnchorImageSrc(tagId: string): string {
  if (KNOWN_IDS.has(tagId)) {
    return `${BASE}/${tagId}.svg`
  }
  return `${BASE}/more.svg`
}

/** Shorter copy for narrow anchor cards; section rows keep `section.label`. */
const ANCHOR_DISPLAY_LABEL: Partial<Record<string, string>> = {
  history: 'History',
}

export function getCategoryAnchorDisplayLabel(tagId: string, sectionLabel: string): string {
  return ANCHOR_DISPLAY_LABEL[tagId] ?? sectionLabel
}
