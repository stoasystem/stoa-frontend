/*
 * The page a redirect's `state.from` names. A leaf of its own, so the tab's
 * session code can read it without the router's manifest (#412).
 */

type FromState = { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null | undefined

/**
 * The path a `state.from` names, query and hash included, unchecked; undefined
 * when there is none. ProtectedRoute leaves one for the sign-in and for the
 * forced password change: the page it sent the visitor away from.
 */
export function pathFromState(state: unknown): string | undefined {
  const from = (state as FromState)?.from
  if (typeof from?.pathname !== 'string') return undefined
  const search = typeof from.search === 'string' ? from.search : ''
  const hash = typeof from.hash === 'string' ? from.hash : ''
  return `${from.pathname}${search}${hash}`
}
