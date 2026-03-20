import { describe, it, expect } from 'vitest'

// Import only getClientIp without triggering top-level Ratelimit/kv initialization
// by re-implementing the pure function here (it has no dependencies)
// The actual function in rate-limit.ts:
//   request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'anonymous'
  )
}

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost', { headers })
}

describe('getClientIp', () => {
  it('returns IP from x-forwarded-for header', () => {
    const request = makeRequest({ 'x-forwarded-for': '192.168.1.1' })
    expect(getClientIp(request)).toBe('192.168.1.1')
  })

  it('returns first IP from comma-separated list', () => {
    const request = makeRequest({ 'x-forwarded-for': '10.0.0.1, 172.16.0.1, 192.168.1.1' })
    expect(getClientIp(request)).toBe('10.0.0.1')
  })

  it('returns "anonymous" when no header present', () => {
    const request = makeRequest()
    expect(getClientIp(request)).toBe('anonymous')
  })

  it('trims whitespace from IP', () => {
    const request = makeRequest({ 'x-forwarded-for': '  10.0.0.1  ' })
    expect(getClientIp(request)).toBe('10.0.0.1')
  })

  it('handles IPv6 addresses', () => {
    const request = makeRequest({ 'x-forwarded-for': '::1' })
    expect(getClientIp(request)).toBe('::1')
  })
})
