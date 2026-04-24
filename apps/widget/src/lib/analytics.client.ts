'use client'

const SESSION_SOURCE_KEY = 'veyond_source'
const SESSION_ID_KEY = 'veyond_session_id'

interface TrackEventPayload {
  event_type: string
  hotel_config_id?: string | null
  experience_id?: string | null
  source?: string | null
  embed_mode?: string | null
  session_id?: string | null
}

export function initAnalyticsSession(sourceFromUrl?: string | null) {
  if (typeof window === 'undefined') return

  if (sourceFromUrl) {
    sessionStorage.setItem(SESSION_SOURCE_KEY, sourceFromUrl)
  }

  if (!sessionStorage.getItem(SESSION_ID_KEY)) {
    sessionStorage.setItem(SESSION_ID_KEY, crypto.randomUUID())
  }
}

export function getAnalyticsSource(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_SOURCE_KEY)
}

export function getAnalyticsSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SESSION_ID_KEY)
}

let eventQueue: TrackEventPayload[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flushEvents() {
  if (eventQueue.length === 0) return
  const batch = eventQueue.splice(0, 20)
  const body = JSON.stringify({ events: batch })
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }))
  } else {
    fetch('/api/analytics/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
  }
}

export function trackEvent(event: Omit<TrackEventPayload, 'source' | 'session_id'>) {
  if (typeof window === 'undefined') return

  eventQueue.push({
    ...event,
    source: getAnalyticsSource(),
    session_id: getAnalyticsSessionId(),
  })

  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flushEvents, 300)
}

const trackedExperiences = new Set<string>()

interface ExperienceViewMeta {
  positionInSection?: number
  sectionId?: string
  totalInSection?: number
}

export function trackExperienceView(
  experienceId: string,
  hotelConfigId?: string | null,
  meta?: ExperienceViewMeta
) {
  const key = `${experienceId}:${hotelConfigId || ''}`
  if (trackedExperiences.has(key)) return
  trackedExperiences.add(key)

  trackEvent({
    event_type: 'experience_view',
    hotel_config_id: hotelConfigId || null,
    experience_id: experienceId,
  })

  // PostHog card-view event carries the slot position so we can analyze
  // conversion-by-slot once the shuffle rolls out. Internal analytics
  // schema doesn't have position columns; PostHog event props are flexible.
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph && typeof ph.capture === 'function') {
      ph.capture('experience_card_viewed', {
        experience_id: experienceId,
        hotel_config_id: hotelConfigId || null,
        position_in_section: meta?.positionInSection ?? null,
        section_id: meta?.sectionId ?? null,
        total_in_section: meta?.totalInSection ?? null,
      })
    }
  }
}
