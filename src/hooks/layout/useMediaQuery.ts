import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether a media query matches, kept current as the window changes.
 *
 * The shell picks its phone or desktop bar with this rather than with CSS
 * breakpoints, because the canvas gives the two different dimensions (Sizes:
 * a 56 bar with a 30 avatar; Placement: 44 with a 28 avatar on a phone), and the
 * components take their sizes as props.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener?.('change', onChange)
      return () => list.removeEventListener?.('change', onChange)
    },
    [query],
  )
  const read = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)

  return useSyncExternalStore(subscribe, read, () => false)
}

/** Placement board: the phone layout below this width. */
export const WIDE_QUERY = '(min-width: 640px)'
/** The admin source list needs room beside the page. */
export const SOURCE_LIST_QUERY = '(min-width: 768px)'
