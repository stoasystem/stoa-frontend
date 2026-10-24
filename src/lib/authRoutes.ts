import { matchPath, parsePath, type Path } from 'react-router-dom'
import { isAdmitted } from '@/app/router/routeAccess'
import {
  CHANGE_PASSWORD_PATH,
  FORBIDDEN_PATH,
  UNAUTHORIZED_PATH,
  legacyRedirects,
  homePathFor,
  navAreaForRole,
  pageRoutes,
  LOGIN_PATH,
  roleHomePaths,
} from '@/app/router/routeManifest'
import { pathFromState } from '@/lib/fromState'
import type { UserRole } from '@/types/user'

// The one screen an account under a forced password change can still use.
export { CHANGE_PASSWORD_PATH }

/**
 * Where a signed-in account starts: its role's home in the route manifest,
 * `/forbidden` for a role it has no home for (a role added on the backend
 * first, or `constructor`, which a bare lookup would answer with a function).
 */
export function getDefaultRouteForRole(role: UserRole) {
  return homePathFor(role)
}

export function canAccessRoute(role: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(role)
}

/**
 * Manifest entries a sign-in never returns to, by their pattern:
 * - `*`, the public catch-all: it matches every path, so it would admit them all;
 * - the password change: an account under a forced change is sent there first
 *   anyway (getPostLoginTarget), and any other account has no reason to be;
 * - the sign-in itself and the two refusal pages: nothing to go back to.
 */
const NOT_A_DESTINATION: ReadonlySet<string> = new Set([
  '*',
  CHANGE_PASSWORD_PATH,
  LOGIN_PATH,
  FORBIDDEN_PATH,
  UNAUTHORIZED_PATH,
])

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
  // Own properties only: `constructor` or `toString` is not a role with a home.
  if (!Object.prototype.hasOwnProperty.call(roleHomePaths, navAreaForRole(role))) return false
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
  // Checked again once parsed: a dot segment can walk `/x/..//` to `//`,
  // which the router's `/` would match.
  if (!isSafePath(url.pathname)) return null
  if (!canUseNextPathForRole(url.pathname, role)) return null
  return `${url.pathname}${url.search}${url.hash}`
}

// The page a redirect's `state.from` names, unchecked; resolveDestination checks it.
export { pathFromState }

/** What a redirect to the forced password change carries: where the visitor was headed (#412). */
export type ForcedChangeState = { from: Path }

/** Where to send a signed-in account, with the state the redirect carries. */
export type RouteTarget = { to: string; state?: ForcedChangeState }

function homeOf(role: UserRole): string {
  // A role the manifest has no home for is refused outright: getDefaultRouteForRole
  // answers `/forbidden` for it.
  return getDefaultRouteForRole(role)
}

/*
 * An account under a forced change goes to the change first, whatever it was
 * headed for, and takes that destination along in `state.from`: the change
 * page's "Continue" leads there once the change is through (#412). Before,
 * a teacher reset by an administrator who opened a request's link landed on
 * their home after the change, and the request was gone.
 */
function sendTo(user: { mustChangePassword?: boolean }, destination: string): RouteTarget {
  if (!user.mustChangePassword) return { to: destination }
  const { pathname = '/', search = '', hash = '' } = parsePath(destination)
  return { to: CHANGE_PASSWORD_PATH, state: { from: { pathname, search, hash } } }
}

/**
 * The one place that decides where a signed-in visitor on the login screen goes:
 * a `?next=` link or the page ProtectedRoute sent them away from (`state.from`),
 * if the role may use it, else the role's home; for a reset account, the
 * password change first, on the way there.
 */
export function getPostLoginTarget(
  user: { role: UserRole; mustChangePassword?: boolean },
  location: { search: string; state?: unknown },
): RouteTarget {
  const queryNext = new URLSearchParams(location.search).get('next')
  const destination =
    resolveDestination(queryNext, user.role) ??
    resolveDestination(pathFromState(location.state), user.role) ??
    homeOf(user.role)
  return sendTo(user, destination)
}

/** getPostLoginTarget's path alone. */
export function getPostLoginPath(
  user: { role: UserRole; mustChangePassword?: boolean },
  location: { search: string; state?: unknown },
) {
  return getPostLoginTarget(user, location).to
}

/**
 * Where an account that signed in again after its tab's session ended goes:
 * back to the page the tab was on, if that account may see it, else home
 * (#217). Only for the same account, which the caller decides. A reset
 * account goes by the password change, as from the login screen.
 */
export function getReturnTarget(
  user: { role: UserRole; mustChangePassword?: boolean },
  returnTo: string | undefined,
): RouteTarget {
  return sendTo(user, resolveDestination(returnTo, user.role) ?? homeOf(user.role))
}

/**
 * getReturnTarget's path alone. The password change's "Continue" leads
 * through it, so the page a forced change interrupted is checked exactly as a
 * sign-in's `next` is (#412).
 */
export function getReturnPath(
  user: { role: UserRole; mustChangePassword?: boolean },
  returnTo: string | undefined,
) {
  return getReturnTarget(user, returnTo).to
}
