import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void) {
  const query = mediaQuery()
  if (!query) return () => {}
  // Safari before 14 only has the deprecated listener pair.
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }
  query.addListener?.(onChange)
  return () => query.removeListener?.(onChange)
}

const read = () => Boolean(mediaQuery()?.matches)

/** Whether the reader asked the system for less motion; follows changes live. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
