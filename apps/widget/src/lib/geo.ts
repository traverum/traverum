/**
 * Parse lat/lng from Supabase geography column.
 * Handles WKB hex (PostGIS default), WKT strings, GeoJSON objects, and raw coordinate pairs.
 * All geographic formats use (lng, lat) order internally; we return { lat, lng }.
 */
export function parseLatLng(location: unknown): { lat: number; lng: number } | null {
  if (location == null) return null
  let lat: number | null = null
  let lng: number | null = null

  if (typeof location === 'string') {
    const s = location.trim()

    // WKB hex — PostGIS default output for geography columns via Supabase.
    // Little-endian POINT with SRID 4326: 01 01000020 E6100000 <16-char X> <16-char Y>
    // Without SRID:                       01 01000000          <16-char X> <16-char Y>
    if (/^[0-9a-f]+$/i.test(s) && (s.length === 50 || s.length === 42)) {
      try {
        const coordOffset = s.length === 50 ? 18 : 10
        const buf = Buffer.from(s, 'hex')
        lng = buf.readDoubleLE(coordOffset / 2)
        lat = buf.readDoubleLE(coordOffset / 2 + 8)
      } catch {
        // fall through to other parsers
      }
    }

    if (lat === null || lng === null) {
      const wktMatch = s.match(/POINT\s*\(\s*([^\s,)]+)\s+([^\s,)]+)\s*\)/i)
      if (wktMatch) {
        lng = parseFloat(wktMatch[1])
        lat = parseFloat(wktMatch[2])
      } else {
        try {
          const parsed = JSON.parse(s) as { type?: string; coordinates?: [number, number] }
          if (parsed?.coordinates && parsed.coordinates.length >= 2) {
            lng = parsed.coordinates[0]
            lat = parsed.coordinates[1]
          }
        } catch {
          const twoNumbers = s.match(/(-?\d+\.?\d*)\s*[, \t]\s*(-?\d+\.?\d*)/)
          if (twoNumbers) {
            const a = parseFloat(twoNumbers[1])
            const b = parseFloat(twoNumbers[2])
            if (Math.abs(a) <= 180 && Math.abs(b) <= 90) {
              lng = a
              lat = b
            } else if (Math.abs(b) <= 180 && Math.abs(a) <= 90) {
              lng = b
              lat = a
            } else {
              lng = a
              lat = b
            }
          }
        }
      }
    }
  } else if (typeof location === 'object' && location !== null) {
    const loc = location as { coordinates?: [number, number] }
    if (loc.coordinates && loc.coordinates.length >= 2) {
      lng = loc.coordinates[0]
      lat = loc.coordinates[1]
    }
  }

  if (lat === null || lng === null) return null
  return { lat, lng }
}
