/**
 * Where a sign-in may return each role (#82).
 *
 * There is no table of prefixes any more: a destination is a page or legacy
 * entry of the route manifest that admits the role, matched as the router
 * matches it. These tests hold that to the manifest for every role, and pin the
 * cases the table used to get wrong.
 */
import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  CHANGE_PASSWORD_PATH,
  FORBIDDEN_PATH,
  LOGIN_PATH,
  UNAUTHORIZED_PATH,
  legacyRedirects,
  navAreaForRole,
  pageRoutes,
  roleHomePaths,
  type RouteAccess,
} from '@/app/router/routeManifest'
import { canUseNextPathForRole, getPostLoginPath } from '@/lib/authRoutes'
import type { UserRole } from '@/types/user'

/**
 * Who an entry admits, written out here rather than taken from the code under
 * test, so a fault in the shared rule (routeAccess.ts) shows up as a failure.
 */
function admits(access: RouteAccess, role: UserRole) {
  return access.kind === 'public' || access.kind === 'signedIn' || (access.kind === 'roles' && access.roles.includes(role))
}

const ROLES: readonly UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

describe('the paths a student may be returned to after sign-in', () => {
  it.each([
    '/',
    '/map/math',
    '/planet/math',
    '/chapter/u-1/l-1',
    '/ask/c-1',
    '/me',
    '/assignments',
    '/chat',
    '/learn/progress',
    '/practice',
    '/question-bank/q-1',
    // A public legacy entry the table left out.
    '/assistant',
    // Routes match case-insensitively; so does the return.
    '/Map/math',
    '/ASK/c-1',
  ])('include %s', (path) => {
    expect(canUseNextPathForRole(path, 'student')).toBe(true)
  })

  it.each([
    '/tutor',
    '/admin/users',
    '/parent',
    '//evil.example',
    '/planetarium',
    '/mapping',
    CHANGE_PASSWORD_PATH,
    // Deeper than any route: a prefix admitted it, the manifest has no such page.
    '/map/math/algebra/u-1/extra',
    '/me/anything',
  ])('exclude %s', (path) => {
    expect(canUseNextPathForRole(path, 'student')).toBe(false)
  })
})

describe('the paths the other roles may be returned to', () => {
  it.each([
    ['organization_admin', '/students/s-1/learning-profile'],
    ['school_viewer', '/students/s-1/learning-profile'],
    ['admin', '/me'],
    ['organization_admin', '/me'],
    ['teacher', '/tutor/requests/r-1'],
    ['teacher', '/teacher-activate'],
    ['parent', '/parent/children/c-1/report'],
    ['parent', '/support'],
    ['admin', '/admin'],
  ] as const)('%s may return to %s', (role, path) => {
    expect(canUseNextPathForRole(path, role)).toBe(true)
  })

  it.each([
    ['teacher', '/'],
    ['teacher', '/me'],
    ['teacher', '/parent'],
    ['parent', '/tutor/requests/r-1'],
    ['parent', '/map/math'],
    ['admin', '/map/math'],
    ['school_teacher', '/admin/users'],
    ['organization_admin', '/ask/c-1'],
    ['teacher', '/students/s-1/learning-profile'],
    ['parent', '/me'],
    ['student', '/students/s-1/learning-profile'],
    // Billing is frozen (card 007): no billing route is registered, so there is nowhere to return to.
    ['parent', '/billing'],
  ] as const)('%s may not return to %s', (role, path) => {
    expect(canUseNextPathForRole(path, role)).toBe(false)
  })

  it.each(['ghost', 'constructor', 'toString', '__proto__'])(
    'a role the manifest has no home for (%s) gets no destination, not even a public page',
    (role) => {
      expect(canUseNextPathForRole('/support', role as UserRole)).toBe(false)
    },
  )
})

describe('every page and legacy entry of the manifest, for every role', () => {
  // A concrete address for an entry's pattern, as a deep link would carry it.
  const sample = (pattern: string) =>
    pattern.replace(/:([A-Za-z]+)/g, (_, name: string) => `${name}-1`).replace(/\/\*$/, '/deep/x')
  const exempt = new Set(['*', CHANGE_PASSWORD_PATH, LOGIN_PATH, FORBIDDEN_PATH, UNAUTHORIZED_PATH])
  const entries = [
    ...pageRoutes.map((route) => ({ pattern: route.path, access: route.access })),
    ...legacyRedirects.map((redirect) => ({ pattern: redirect.from, access: redirect.access })),
  ]
  const cases = ROLES.flatMap((role) =>
    entries.filter((entry) => !exempt.has(entry.pattern)).map((entry) => ({ role, ...entry, path: sample(entry.pattern) })),
  )

  it.each(cases)('$role, ?next=$path', ({ role, access, path }) => {
    const home = roleHomePaths[navAreaForRole(role)]
    const destination = getPostLoginPath({ role }, { search: `?next=${encodeURIComponent(path)}` })
    expect(destination).toBe(admits(access, role) ? path : home)
  })

  it.each(ROLES.flatMap((role) => [...exempt].map((pattern) => ({ role, pattern }))))(
    '$role is never returned to the exempt $pattern',
    ({ role, pattern }) => {
      const path = pattern === '*' ? '/no-such-page' : pattern
      expect(canUseNextPathForRole(path, role)).toBe(false)
    },
  )

  // Judged by the router, not by the rule under test: the entry react-router
  // itself picks for the destination (catch-all included) must admit the role.
  const routes = [
    ...pageRoutes.map((route) => ({ path: route.path, access: route.access })),
    ...legacyRedirects.map((redirect) => ({ path: redirect.from, access: redirect.access })),
  ]
  it.each(cases)('$role, ?next=$path lands only where the router admits it', ({ role, path }) => {
    const destination = getPostLoginPath({ role }, { search: `?next=${encodeURIComponent(path)}` })
    if (destination === roleHomePaths[navAreaForRole(role)]) return
    const matches = matchRoutes(routes, destination.split(/[?#]/)[0]) ?? []
    const won = matches[matches.length - 1]?.route as { path: string; access: RouteAccess } | undefined
    expect(won?.path).not.toBe('*')
    expect(won && admits(won.access, role)).toBe(true)
  })

  it('covers every role and entry it claims to', () => {
    // Guards the table above against an empty manifest or role list.
    expect(cases.length).toBeGreaterThan(ROLES.length * 40)
  })
})

describe('where getPostLoginPath sends a signed-in visitor', () => {
  const student = { role: 'student' as const }
  const sentAwayFrom = (from: { pathname: string; search?: string; hash?: string }) => ({
    search: '',
    state: { from },
  })

  // The page ProtectedRoute sent the visitor away from is checked as the whole
  // address it rebuilds, not by its pathname alone: a forged search or hash
  // cannot walk a permitted pathname off the site or out of the role.
  it.each([
    [{ pathname: '/map', search: '/../\\evil.example' }],
    [{ pathname: '/me', hash: '/../../admin' }],
  ])("goes to the role's home when state.from is forged as %o", (from) => {
    const destination = getPostLoginPath(student, sentAwayFrom(from))

    expect(destination).toBe('/')
    expect(new URL(destination, window.location.origin).origin).toBe(window.location.origin)
  })

  it("returns to state.from with its query and hash", () => {
    expect(getPostLoginPath(student, sentAwayFrom({ pathname: '/me', search: '?ok=1', hash: '#h' }))).toBe(
      '/me?ok=1#h',
    )
  })

  it('sends a reset account to the password change before a valid ?next= or state.from', () => {
    const location = { search: '?next=/me', state: { from: { pathname: '/map/math' } } }

    // Both would be followed for an account that is not under a forced change.
    expect(getPostLoginPath(student, location)).toBe('/me')
    expect(getPostLoginPath({ ...student, mustChangePassword: true }, location)).toBe('/settings/password')
  })
})
