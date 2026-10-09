/**
 * Typing a protected address straight into the address bar is refused, not
 * merely left out of the navigation: signed out goes to sign-in, the wrong
 * role goes to /forbidden, as the guards always did. These are what the
 * browser shows; the backend still decides every request on its own.
 *
 * The expectations are written out, not read from the manifest, so loosening
 * an entry's `access` there turns these red.
 */
import { describe, expect, it, vi } from 'vitest'
// The real bundles, so the guard's loading line is read as a visitor reads it.
import '@/i18n'
import { openAs, type Viewer } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

const STUDENT_ROUTES = [
  ['/map/math', 'MapPage'],
  ['/map/math/fractions', 'MapPage'],
  ['/map/math/fractions/u-1', 'MapPage'],
  ['/chapter/u-1', 'ChapterPage'],
  ['/chapter/u-1/l-1', 'LessonStagePage'],
  ['/ask', 'AskPage'],
  ['/ask/c-1', 'AskPage'],
  ['/assignments', 'StudentAssignmentsPage'],
] as const

const OTHER_ROLES: readonly Viewer[] = [
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

describe('student routes', () => {
  it.each(STUDENT_ROUTES)('open for a student (%s)', (path, page) => {
    expect(openAs('student', path)).toMatchObject({ pathname: path, page })
  })

  it.each(STUDENT_ROUTES)('send a signed-out visitor to sign in, remembering %s', (path) => {
    const landed = openAs('anonymous', path)

    expect(landed.pathname).toBe('/login')
    expect(landed.page).toBe('EntryPage')
    expect(landed.state).toMatchObject({ from: { pathname: path } })
  })

  for (const viewer of OTHER_ROLES) {
    it.each(STUDENT_ROUTES)(`refuse ${viewer} (%s)`, (path) => {
      expect(openAs(viewer, path)).toMatchObject({ pathname: '/forbidden', page: 'ForbiddenPage' })
    })
  }

  it.each(STUDENT_ROUTES)('wait for the account after a refresh before deciding (%s)', (path) => {
    // A stored token and no account yet: the guard neither shows the page nor
    // sends the visitor away while /auth/me is still on its way.
    const landed = openAs('pending', path)

    expect(landed).toMatchObject({ pathname: path, page: null })
    expect(landed.text).toContain('Loading account')
  })

  it('send a reset student to the password change first', () => {
    expect(openAs('student', '/ask', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })
})

// The account page (#46): a student's, and the profile page of administrators
// and the organisation roles. Teachers and parents keep their own.
describe('/me', () => {
  it.each(['student', 'admin', 'organization_admin', 'school_teacher', 'school_viewer'] as const)(
    'opens for a %s',
    (viewer) => {
      expect(openAs(viewer, '/me')).toMatchObject({ pathname: '/me', page: 'MePage' })
    },
  )

  it.each(['parent', 'teacher'] as const)('refuses a %s', (viewer) => {
    expect(openAs(viewer, '/me')).toMatchObject({ pathname: '/forbidden', page: 'ForbiddenPage' })
  })

  it('sends a signed-out visitor to sign in, remembering /me', () => {
    const landed = openAs('anonymous', '/me')
    expect(landed).toMatchObject({ pathname: '/login', page: 'EntryPage' })
    expect(landed.state).toMatchObject({ from: { pathname: '/me' } })
  })

  it.each(['student', 'admin'] as const)('sends a reset %s from /me to the password change', (viewer) => {
    expect(openAs(viewer, '/me', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })

  it('keeps a reset student on the password change instead of forwarding it to /me', () => {
    expect(openAs('student', '/settings/password', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })

  it('forwards a student who was not reset from /settings/password to /me', () => {
    expect(openAs('student', '/settings/password')).toMatchObject({ pathname: '/me', page: 'MePage' })
  })
})

describe('/ is the star map for a student and the front door for everyone else', () => {
  it('shows a student the star map', () => {
    expect(openAs('student', '/')).toMatchObject({ pathname: '/', page: 'MapHomePage' })
  })

  it.each(['anonymous', ...OTHER_ROLES] as Viewer[])('shows %s the entry page, not the star map', (viewer) => {
    // EntryPage signs the visitor in, or sends them to their own home.
    expect(openAs(viewer, '/')).toMatchObject({ pathname: '/', page: 'EntryPage' })
  })

  it('sends a reset student to the password change first', () => {
    expect(openAs('student', '/', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
    })
  })
})

describe('other roles cannot reach each other either', () => {
  it.each([
    ['student', '/teacher'],
    ['student', '/parent'],
    ['student', '/admin/users'],
    ['student', '/organization/learning-operations'],
    ['teacher', '/admin'],
    ['parent', '/teacher/requests/r-1'],
  ] as const)('refuses %s at %s', (viewer, path) => {
    expect(openAs(viewer, path).pathname).toBe('/forbidden')
  })

  it.each(['/teacher', '/parent', '/admin', '/settings/password'])(
    'sends a signed-out visitor at %s to sign in',
    (path) => {
      expect(openAs('anonymous', path).pathname).toBe('/login')
    },
  )
})
