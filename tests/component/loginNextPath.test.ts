/**
 * Where a sign-in may return a student. `/` is the student's home, and as a
 * prefix it must admit only itself -- not every path that starts with `/`.
 *
 * The student's prefixes are also held to the route manifest, both ways: each
 * one is a page or legacy redirect behind the student guard, and every entry
 * behind that guard is covered, so the two cannot drift apart.
 */
import { describe, expect, it } from 'vitest'
import { isAdmitted } from '@/app/router/AppRoutes'
import { legacyRedirects, pageRoutes, type RouteAccess } from '@/app/router/routeManifest'
import { canUseNextPathForRole, roleNextPathPrefixes } from '@/lib/authRoutes'

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
  ])('include %s', (path) => {
    expect(canUseNextPathForRole(path, 'student')).toBe(true)
  })

  it.each(['/tutor', '/admin/users', '/parent', '/billing', '//evil.example', '/planetarium', '/mapping', '/settings/password'])(
    'exclude %s',
    (path) => {
      expect(canUseNextPathForRole(path, 'student')).toBe(false)
    },
  )

  it('leave the other roles as they were', () => {
    expect(canUseNextPathForRole('/', 'teacher')).toBe(false)
    expect(canUseNextPathForRole('/tutor/requests/r-1', 'teacher')).toBe(true)
    expect(canUseNextPathForRole('/admin', 'admin')).toBe(true)
  })
})

describe("the student's sign-in prefixes and the route manifest", () => {
  const firstSegment = (path: string) => (path === '/' ? '/' : `/${path.split('/')[1]}`)
  const behindStudentGuard = (access: RouteAccess) =>
    access.kind === 'roles' && access.roles.includes('student')
  const entries = [
    ...pageRoutes.map((route) => ({ path: route.path, access: route.access })),
    ...legacyRedirects.map((redirect) => ({ path: redirect.from, access: redirect.access })),
  ]
  const student = { role: 'student' as const }

  it.each(roleNextPathPrefixes.student)('%s is a page or redirect behind the student guard', (prefix) => {
    const matching = entries.filter((entry) => firstSegment(entry.path) === prefix)
    expect(matching.some((entry) => behindStudentGuard(entry.access))).toBe(true)
    // Nothing under a student prefix belongs to another role alone.
    for (const entry of matching) expect(isAdmitted(entry.access, student, true)).toBe(true)
  })

  it('covers every page and redirect behind the student guard', () => {
    const uncovered = entries
      .filter((entry) => behindStudentGuard(entry.access))
      .map((entry) => entry.path)
      .filter((path) => !roleNextPathPrefixes.student.includes(firstSegment(path)))
    expect(uncovered).toEqual([])
  })
})
