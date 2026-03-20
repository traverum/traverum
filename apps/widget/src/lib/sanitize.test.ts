import { describe, it, expect } from 'vitest'
import { stripHtml, escapeHtml, sanitizeGuestText, sanitizeGuestEmail } from './sanitize'

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold')
  })

  it('removes nested tags', () => {
    expect(stripHtml('<div><p>hello</p></div>')).toBe('hello')
  })

  it('removes script tags', () => {
    expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it('trims whitespace', () => {
    expect(stripHtml('  hello  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('passes through plain text', () => {
    expect(stripHtml('just text')).toBe('just text')
  })

  it('removes self-closing tags', () => {
    expect(stripHtml('before<br/>after')).toBe('beforeafter')
  })
})

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b')
  })

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#39;s")
  })

  it('escapes all special chars in one string', () => {
    expect(escapeHtml('<script>"alert(\'xss\')&"</script>')).toBe(
      '&lt;script&gt;&quot;alert(&#39;xss&#39;)&amp;&quot;&lt;/script&gt;'
    )
  })

  it('passes through safe text', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('sanitizeGuestText', () => {
  it('strips HTML and returns plain text', () => {
    expect(sanitizeGuestText('<b>John</b>')).toBe('John')
  })

  it('truncates to default 200 chars', () => {
    const long = 'a'.repeat(300)
    expect(sanitizeGuestText(long)).toHaveLength(200)
  })

  it('truncates to custom max length', () => {
    const long = 'a'.repeat(100)
    expect(sanitizeGuestText(long, 50)).toHaveLength(50)
  })

  it('handles short text without truncation', () => {
    expect(sanitizeGuestText('short')).toBe('short')
  })

  it('strips HTML then truncates', () => {
    const input = '<b>' + 'a'.repeat(300) + '</b>'
    const result = sanitizeGuestText(input)
    expect(result).toHaveLength(200)
    expect(result).not.toContain('<')
  })
})

describe('sanitizeGuestEmail', () => {
  it('trims and lowercases', () => {
    expect(sanitizeGuestEmail('  John@Example.COM  ')).toBe('john@example.com')
  })

  it('accepts valid email', () => {
    expect(sanitizeGuestEmail('guest@hotel.com')).toBe('guest@hotel.com')
  })

  it('throws on invalid email (no @)', () => {
    expect(() => sanitizeGuestEmail('notanemail')).toThrow('Invalid email format')
  })

  it('throws on invalid email (no domain)', () => {
    expect(() => sanitizeGuestEmail('user@')).toThrow('Invalid email format')
  })

  it('throws on empty string', () => {
    expect(() => sanitizeGuestEmail('')).toThrow('Invalid email format')
  })

  it('throws on spaces only', () => {
    expect(() => sanitizeGuestEmail('   ')).toThrow('Invalid email format')
  })

  it('truncates to 320 chars before validation', () => {
    const longLocal = 'a'.repeat(300)
    const email = `${longLocal}@example.com`
    const result = sanitizeGuestEmail(email)
    expect(result.length).toBeLessThanOrEqual(320)
  })
})
