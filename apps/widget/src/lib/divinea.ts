// ---------------------------------------------------------------------------
// DiVinea OCTO API client — Phase 1 (read-only availability)
// Docs: docs/context7/divinea-api-documentation.md
// ---------------------------------------------------------------------------

const DIVINEA_API_KEY = process.env.DIVINEA_API_KEY
const DIVINEA_WINERY_ID = process.env.DIVINEA_WINERY_ID
const DIVINEA_API_BASE_URL = process.env.DIVINEA_API_BASE_URL

// ── Types ──────────────────────────────────────────────────────────────────

export interface AvailabilityRequest {
  productId: string
  optionId?: string
  localDateStart: string // yyyy-MM-dd
  localDateEnd: string   // yyyy-MM-dd
  availabilityIds?: string[]
}

export interface DivineaSlotExperience {
  id: string
  title: string
  color?: string
  duration: number
}

export interface DivineaSlotRoom {
  id: string
  name: string
  capacity: number
  color?: string
}

export interface DivineaExtendedSlot {
  id: string
  day: string            // yyyy-MM-dd
  startTime: string      // ISO datetime e.g. "2025-06-01T10:00:00"
  endTime: string        // ISO datetime
  active: boolean
  availableSeats: number
  occupiedCount: number
  maxParties: number
  maxPartiesThisExperience?: number
  enabledLanguages: string[]
  defaultLanguages?: string[]
  experience: DivineaSlotExperience
  room?: DivineaSlotRoom
  roomName?: string
  isEvent?: boolean
}

export interface OctoSupplierContact {
  address?: string
  email?: string
  telephone?: string
  website?: string
}

export interface OctoSupplier {
  id: string
  name: string
  endpoint?: string
  contact?: OctoSupplierContact
}

// ── Helpers ────────────────────────────────────────────────────────────────

function assertConfig(): { apiKey: string; wineryId: string; baseUrl: string } {
  if (!DIVINEA_API_KEY) throw new Error('Missing env DIVINEA_API_KEY')
  if (!DIVINEA_WINERY_ID) throw new Error('Missing env DIVINEA_WINERY_ID')
  if (!DIVINEA_API_BASE_URL) throw new Error('Missing env DIVINEA_API_BASE_URL')
  return {
    apiKey: DIVINEA_API_KEY,
    wineryId: DIVINEA_WINERY_ID,
    baseUrl: DIVINEA_API_BASE_URL,
  }
}

function headers(cfg: ReturnType<typeof assertConfig>) {
  return {
    'APIKey': cfg.apiKey,
    'X-DWS-WINERY': cfg.wineryId,
    'Content-Type': 'application/json',
  }
}

async function divinea<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<T> {
  const cfg = assertConfig()
  const url = `${cfg.baseUrl}${path}`

  const res = await fetch(url, {
    method,
    headers: headers(cfg),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)')
    throw new Error(
      `DiVinea ${method} ${path} → ${res.status}: ${text}`,
    )
  }

  return res.json() as Promise<T>
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getSupplier(): Promise<OctoSupplier> {
  return divinea<OctoSupplier>('GET', '/octo/supplier')
}

export async function getAvailabilityExtended(
  productId: string,
  optionId: string | null,
  localDateStart: string,
  localDateEnd: string,
): Promise<DivineaExtendedSlot[]> {
  const body: AvailabilityRequest = {
    productId,
    localDateStart,
    localDateEnd,
  }
  if (optionId) body.optionId = optionId

  return divinea<DivineaExtendedSlot[]>(
    'POST',
    '/octo/availability/extended',
    body,
  )
}
