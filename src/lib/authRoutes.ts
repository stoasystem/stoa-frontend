import { matchPath } from 'react-router-dom'
import { isAdmitted } from '@/app/router/routeAccess'
import {
  CHANGE_PASSWORD_PATH,
  FORBIDDEN_PATH,
  legacyRedirects,
  navAreaForRole,
  pageRoutes,
  roleHomePaths,
} from '@/app/router/routeManifest'
import type { UserRole } from '@/types/user'

// The one screen an account under a forced password change can still use.
export { CHANGE_PASSWORD_PATH }

/** Where a signed-in account starts: its role's home in the route manifest. */
export function getDefaultRouteForRole(role: UserRole) {
  return roleHomePaths[navAreaForRole(role)]
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}

/**
 * Manifest entries a sign-in never returns to, by their pattern:
 * - `*`, the public catch-all: it matches every path, so it would admit them all;
 * - the password change: an account under a forced change is sent there first
 *   anyway (getPostLoginPath), and any other account has no reason to be.
 */
const NOT_A_DESTINATION: ReadonlySet<string> = new Set(['*', CHANGE_PASSWORD_PATH])

function destinations() {
  return [
    ...pageRoutes.map((route) => ({ pattern: route.path, access: route.access })),
    ...legacyRedirects.map((redirect) => ({ pattern: redirect.from, access: redirect.access })),
  ].filter((entry) => !NOT_A_DESTINATION.has(entry.pattern))
}

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

/**
 * Whether a normalised pathname (no query, no hash) is a page or legacy entry
 * of the route manifest that admits the role: where a deep link may send it
 * once it has signed in. Anything else falls back to the role's home.
 *
 * Read from the manifest itself (#82), with the router's own matching (react-
 * router's `matchPath`, case-insensitive as the routes are), so a page added
 * for a role is a destination for it at once and a path no route has is not.
 */
export function canUseNextPathForRole(pathname: string, role: UserRole) {
  // A role the manifest has no home for (a session stored before it existed)
  // gets none of the public pages either, and no exception mid-render.
  if ((roleHomePaths[navAreaForRole(role)] as string | undefined) === undefined) return false
  const account = { role }
  return destinations().some(
    ({ pattern, access }) => matchPath({ path: pattern, end: true }, pathname) !== null && isAdmitted(access, account, true),
  )
}

/**
 * A requested destination as a same-origin path the role may use, or null.
 *
 * The prefix test runs on the pathname the browser would actually load, after
 * parsing: a query or hash no longer hides a permitted page (`/teacher-activate?
 * token=…`), and dot segments or backslashes cannot walk out of one
 * (`/map/../admin`, `/\evil.example`).
 */
function resolveDestination(path: unknown, role: UserRole): string | null {
  if (!isSafePath(path)) return null
  let url: URL
  try {
    url = new URL(path, window.location.origin)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null
  if (!canUseNextPathForRole(url.pathname, role)) return null
  return `${url.pathname}${url.search}${url.hash}`
}

type FromState = { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null | undefined

/**
 * The one place that decides where a signed-in visitor on the login screen goes:
 * the password change for a reset account, else a `?next=` link or the page
 * ProtectedRoute sent them away from (`state.from`), if the role may use it,
 * else the role's home.
 */
export function getPostLoginPath(
  user: { role: UserRole; mustChangePassword?: boolean },
  location: { search: string; state?: unknown },
) {
  if (user.mustChangePassword) return CHANGE_PASSWORD_PATH

  const queryNext = new URLSearchParams(location.search).get('next')
  const next = resolveDestination(queryNext, user.role)
  if (next) return next

  const from = (location.state as FromState)?.from
  if (typeof from?.pathname === 'string') {
    const search = typeof from.search === 'string' ? from.search : ''
    const hash = typeof from.hash === 'string' ? from.hash : ''
    const back = resolveDestination(`${from.pathname}${search}${hash}`, user.role)
    if (back) return back
  }

  // A role the manifest has no home for is refused outright; left undefined,
  // the redirect would resolve to wherever an empty path happens to point.
  return (getDefaultRouteForRole(user.role) as string | undefined) ?? FORBIDDEN_PATH
}
