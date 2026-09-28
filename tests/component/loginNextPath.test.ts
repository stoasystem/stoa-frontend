/**
 * Where a sign-in may return a student. `/` is the student's home, and as a
 * prefix it must admit only itself -- not every path that starts with `/`.
 */
import { describe, expect, it } from 'vitest'
import { canUseNextPathForRole } from '@/hooks/auth/useLoginMutation'

describe('the paths a student may be returned to after sign-in', () => {
  it.each(['/', '/planet/math', '/chapter/u-1/l-1', '/ask/c-1', '/me', '/assignments', '/chat'])(
    'include %s',
    (path) => {
      expect(canUseNextPathForRole(path, 'student')).toBe(true)
    },
  )

  it.each(['/tutor', '/admin/users', '/parent', '/billing', '//evil.example', '/planetarium'])(
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
