import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { enableAnalytics } from '@/lib/env'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { matchRouteTemplate } from '@/services/analytics/routeTemplate'
import { setVitalsRoute, startWebVitals } from '@/services/analytics/webVitals'

// The page's own loading skeleton, while its code or copy loads.
const LOADING_SELECTOR = '[data-page-skeleton]'
const SETTLE_TIMEOUT_MS = 15_000

/**
 * One view per page: sends `page_viewed` with the route pattern and how long
 * the page took to replace its skeleton. A view still loading when the next
 * one starts is sent without a time.
 */
function startView(route: string, startedAt: number) {
  let done = false
  let observer: MutationObserver | null = null
  let timer: number | undefined

  const send = (loadMs: number | null) => {
    if (done) return
    done = true
    observer?.disconnect()
    window.clearTimeout(timer)
    trackEvent('page_viewed', { route, load_ms: loadMs })
  }
  const check = () => {
    if (!document.querySelector(LOADING_SELECTOR)) send(Math.round(performance.now() - startedAt))
  }

  check()
  if (!done) {
    observer = new MutationObserver(check)
    observer.observe(document.body, { childList: true, subtree: true })
    timer = window.setTimeout(() => send(null), SETTLE_TIMEOUT_MS)
  }
  return () => send(null)
}

export function PageViewTracker() {
  const { pathname } = useLocation()
  const lastPath = useRef<string | null>(null)
  const supersede = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (lastPath.current === pathname) return
    const first = lastPath.current === null
    lastPath.current = pathname

    const route = matchRouteTemplate(pathname)
    setVitalsRoute(route)
    if (first && enableAnalytics) startWebVitals()

    supersede.current?.()
    // The first view counts from the navigation that opened the tab.
    supersede.current = startView(route, first ? 0 : performance.now())
  }, [pathname])

  return null
}
