import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EXPERIENCE_TAGS, getTagLabel } from '@traverum/shared'
import type { ExperienceWithMedia } from '@/lib/hotels'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents to EUR currency string
 * All prices are stored in cents as per project rules
 */
export function formatPrice(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Format date for display using globally unambiguous format.
 * Examples: "20 Mar 2025", "20 Mar" (short)
 */
export function formatDate(date: Date | string, options?: { short?: boolean }): string {
  let dayNum: number
  let monthIdx: number
  let year: number

  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-')
    dayNum = parseInt(d, 10)
    monthIdx = parseInt(m, 10) - 1
    year = parseInt(y, 10)
  } else {
    const d = typeof date === 'string' ? new Date(date) : date
    dayNum = d.getDate()
    monthIdx = d.getMonth()
    year = d.getFullYear()
  }

  const mon = MONTH_NAMES_SHORT[monthIdx]
  return options?.short ? `${dayNum} ${mon}` : `${dayNum} ${mon} ${year}`
}

/**
 * Format time for display (24h European format)
 * Handles "HH:MM:SS" or "HH:MM" input
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

/**
 * Format a start time + duration into a range string like "15:00–17:00".
 */
export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + durationMinutes
  const endH = Math.floor(totalMinutes / 60) % 24
  const endM = totalMinutes % 60
  const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  return `${start}\u2013${end}`
}

/**
 * Calculate darker shade of a hex color for hover states
 */
export function darkenColor(hex: string, percent: number = 15): string {
  // Remove # if present
  const color = hex.replace('#', '')
  
  // Parse hex to RGB
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  
  // Darken
  const darken = (value: number) => Math.max(0, Math.floor(value * (1 - percent / 100)))
  
  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  
  return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`
}

/**
 * Calculate lighter shade of a hex color for backgrounds
 */
export function lightenColor(hex: string, percent: number = 90): string {
  const color = hex.replace('#', '')
  
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  
  const lighten = (value: number) => Math.min(255, Math.floor(value + (255 - value) * (percent / 100)))
  
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  
  return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`
}

/**
 * Get embed mode from URL search params
 */
export type EmbedMode = 'full' | 'section'

export function getEmbedMode(searchParams: { embed?: string }): EmbedMode {
  const embed = searchParams.embed
  if (embed === 'section') return 'section'
  return 'full'
}

/**
 * Generate a random ID (for client-side use)
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Validate that a string is a valid hex color (#RGB, #RRGGBB, RGB, RRGGBB).
 * Returns the 6-char hex (without #) or null if invalid.
 */
function normalizeHex(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.trim().replace('#', '')
  // Support 3-char shorthand: "abc" → "aabbcc"
  const expanded = cleaned.length === 3
    ? cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2]
    : cleaned
  if (expanded.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(expanded)) return null
  return expanded
}

/**
 * Convert hex color to HSL string (without hsl() wrapper)
 * Returns format: "h s% l%" for use in CSS variables.
 * Falls back to a neutral grey ("0 0% 50%") if the input is not a valid hex color.
 */
export function hexToHsl(hex: string): string {
  const color = normalizeHex(hex)
  if (!color) {
    // Malformed input — return neutral grey so CSS doesn't break with NaN
    console.warn(`hexToHsl: invalid hex color "${hex}", falling back to neutral grey`)
    return '0 0% 50%'
  }

  // Parse hex to RGB
  const r = parseInt(color.substring(0, 2), 16) / 255
  const g = parseInt(color.substring(2, 4), 16) / 255
  const b = parseInt(color.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h: number, s: number, l: number
  
  l = (max + min) / 2
  
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
      default: h = 0
    }
  }
  
  // Convert to percentages
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  l = Math.round(l * 100)
  
  return `${h} ${s}% ${l}%`
}

// --- Tag section grouping (shared between NetflixLayout & CategoryAnchorSection) ---

export interface TagSection {
  id: string
  label: string
  experiences: ExperienceWithMedia[]
}

export function groupExperiencesByTag(experiences: ExperienceWithMedia[]): TagSection[] {
  const result: TagSection[] = []
  const grouped = new Map<string, ExperienceWithMedia[]>()
  const untagged: ExperienceWithMedia[] = []

  for (const exp of experiences) {
    const expTags = (exp.tags || []).filter((t: string) =>
      EXPERIENCE_TAGS.some(tag => tag.id === t)
    )

    if (expTags.length === 0) {
      untagged.push(exp)
    } else {
      for (const tag of expTags) {
        if (!grouped.has(tag)) grouped.set(tag, [])
        grouped.get(tag)!.push(exp)
      }
    }
  }

  for (const tag of EXPERIENCE_TAGS) {
    const exps = grouped.get(tag.id)
    if (exps && exps.length > 0) {
      result.push({ id: tag.id, label: getTagLabel(tag.id), experiences: exps })
    }
  }

  result.sort((a, b) => b.experiences.length - a.experiences.length)

  return result
}