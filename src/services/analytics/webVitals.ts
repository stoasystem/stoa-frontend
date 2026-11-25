import { trackEvent } from '@/services/analytics/analyticsClient'

/*
 * LCP, INP and CLS from the browser's own PerformanceObserver, no library.
 * INP is approximated by the longest interaction seen on the route. Each
 * route pattern reports once, when the page is hidden.
 */

type Vitals = { lcp: number | null; inp: number | null; cls: number }
type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean }
type EventTiming = PerformanceEntry & { interactionId?: number }

const INTERACTION_THRESHOLD_MS = 40

const byRoute = new Map<string, Vitals>()
const sent = new Set<string>()
let currentRoute: string | null = null
let loadRoute: string | null = null
let started = false

function vitalsOf(route: string) {
  let vitals = byRoute.get(route)
  if (!vitals) {
    vitals = { lcp: null, inp: null, cls: 0 }
    byRoute.set(route, vitals)
  }
  return vitals
}

/** The route pattern now on screen; PageViewTracker keeps it current. */
export function setVitalsRoute(route: string) {
  currentRoute = route
  loadRoute ??= route
}

function observe(type: string, onEntries: (entries: PerformanceEntry[]) => void, options: Record<string, unknown> = {}) {
  try {
    const observer = new PerformanceObserver((list) => onEntries(list.getEntries()))
    observer.observe({ type, buffered: true, ...options } as PerformanceObserverInit)
  } catch {
    // This browser does not report this entry type.
  }
}

export function flushWebVitals() {
  for (const [route, vitals] of byRoute) {
    if (sent.has(route)) continue
    if (vitals.lcp === null && vitals.inp === null && vitals.cls === 0) continue
    sent.add(route)
    trackEvent('web_vitals', {
      route,
      lcp: vitals.lcp === null ? null : Math.round(vitals.lcp),
      inp: vitals.inp === null ? null : Math.round(vitals.inp),
      cls: Math.round(vitals.cls * 1000) / 1000,
    })
  }
}

export function startWebVitals() {
  if (started || typeof PerformanceObserver === 'undefined') return
  started = true

  // LCP belongs to the page the tab was opened on.
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1]
    if (last && loadRoute) vitalsOf(loadRoute).lcp = last.startTime
  })

  const onInteraction = (entries: PerformanceEntry[]) => {
    if (!currentRoute) return
    const vitals = vitalsOf(currentRoute)
    for (const entry of entries as EventTiming[]) {
      if (entry.entryType === 'event' && !entry.interactionId) continue
      vitals.inp = Math.max(vitals.inp ?? 0, entry.duration)
    }
  }
  observe('event', onInteraction, { durationThreshold: INTERACTION_THRESHOLD_MS })
  observe('first-input', onInteraction)

  observe('layout-shift', (entries) => {
    if (!currentRoute) return
    const vitals = vitalsOf(currentRoute)
    for (const entry of entries as LayoutShift[]) {
      if (!entry.hadRecentInput) vitals.cls += entry.value
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushWebVitals()
  })
  window.addEventListener('pagehide', flushWebVitals)
}
