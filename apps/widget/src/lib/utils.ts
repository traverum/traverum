import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

/**
 * Format date for display (European standard: dd.mm.yyyy)
 * Examples: "20.01.2025", "20.01" (short)
 */
export function formatDate(date: Date | string, options?: { short?: boolean }): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  if (options?.short) {
    // Short format without year: "20.01"
    return `${day}.${month}`
  }
  
  // Full format: "20.01.2025"
  return `${day}.${month}.${year}`
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
 * Convert hex color to HSL string (without hsl() wrapper)
 * Returns format: "h s% l%" for use in CSS variables
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  const color = hex.replace('#', '')
  
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