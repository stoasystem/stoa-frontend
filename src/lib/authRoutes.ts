import { CHANGE_PASSWORD_PATH, navAreaForRole, roleHomePaths } from '@/app/router/routeManifest'
import type { UserRole } from '@/types/user'

// The one screen an account under a forced password change can still use.
export { CHANGE_PASSWORD_PATH }

// Where a guard sends a role a route is not for (RoleRoute, the manifest's /forbidden).
const FORBIDDEN_PATH = '/forbidden'

/** Where a signed-in account starts: its role's home in the route manifest. */
export function getDefaultRouteForRole(role: UserRole) {
  return roleHomePaths[navAreaForRole(role)]
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}

// Where a deep link may send each role once it has signed in. Anything else,
// and anything that is not a same-origin path, falls back to the role's home.
//
// The student's list is every first path segment the route manifest puts
// behind the student guard: today's pages (#45; the map at /map since #72),
// then the legacy entries that redirect into them, so a sign-in that
// interrupted an old link still lands where it pointed. A test holds it to the
// manifest in both directions (tests/component/loginNextPath.test.ts).
export const roleNextPathPrefixes: Readonly<Record<UserRole, readonly string[]>> = {
  student: [
    '/', '/map', '/chapter', '/ask', '/me', '/assignments',
    '/planet', '/chat', '/profile',
    '/learn', '/practice', '/question-bank', '/dashboard', '/classroom', '/learning-history',
  ],
  parent: ['/parent', '/billing', '/support'],
  teacher: ['/tutor', '/support', '/teacher-activate'],
  admin: ['/admin'],
  organization_admin: ['/organization'],
  school_teacher: ['/organization'],
  school_viewer: ['/organization'],
}

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

/** Whether a normalised pathname (no query, no hash) lies under one of the role's prefixes. */
export function canUseNextPathForRole(pathname: string, role: UserRole) {
  // A role missing from the table (a session stored before it existed) gets
  // its home, rather than an exception in the middle of rendering the login.
  const prefixes: readonly string[] | undefined = roleNextPathPrefixes[role]
  return (
    prefixes?.some((prefix) =>
      // `/` admits only itself: as a prefix it would admit every path.
      prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ?? false
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
