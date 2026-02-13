/**
 * Input sanitization and HTML escaping utilities.
 * 
 * - sanitizeGuestText / sanitizeGuestEmail: strip dangerous content before storing in DB
 * - escapeHtml: escape HTML entities for safe interpolation in email templates
 */

// Strip HTML tags from a string
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

// Escape HTML entities for safe interpolation in HTML contexts (emails)
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Sanitize guest text input (name, phone)
export function sanitizeGuestText(input: string, maxLength = 200): string {
  return stripHtml(input).slice(0, maxLength)
}

// Sanitize and validate guest email
export function sanitizeGuestEmail(input: string): string {
  const trimmed = input.trim().toLowerCase().slice(0, 320)
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    throw new Error('Invalid email format')
  }
  return trimmed
}
