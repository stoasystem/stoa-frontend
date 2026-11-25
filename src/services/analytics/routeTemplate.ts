import { matchRoutes } from 'react-router-dom'
import { legacyRedirects, pageRoutes } from '@/app/router/routeManifest'

/** Reported when no pattern matches: never the address itself. */
export const UNMATCHED_ROUTE = '*'

const MANIFEST_PATTERNS: readonly string[] = [
  ...pageRoutes.map((route) => route.path),
  ...legacyRedirects.map((redirect) => redirect.from),
]

/**
 * The route pattern an address is served by, e.g. `/practice/:lessonId`.
 * Analytics reports this, never the address, so no id leaves the browser.
 * The result is always one of `patterns` or `UNMATCHED_ROUTE`.
 */
export function matchRouteTemplate(pathname: string, patterns: readonly string[] = MANIFEST_PATTERNS): string {
  const routes = patterns.map((path) => ({ path }))
  const matches = matchRoutes(routes, pathname || '/')
  const pattern = matches?.[matches.length - 1]?.route.path
  return pattern !== undefined && patterns.includes(pattern) ? pattern : UNMATCHED_ROUTE
}
