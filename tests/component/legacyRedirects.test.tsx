/**
 * #13 point 2: no old student link ends on a 404. Each old route is sent to
 * its agreed target, one test per redirect. The expectations are written out
 * here rather than read from the manifest, so deleting a redirect there turns
 * its test red instead of taking the test with it.
 */
import { describe, expect, it, vi } from 'vitest'
import { openAs } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

describe('legacy student routes redirect to the planet routes', () => {
  it.each([
    // /learn*
    ['/learn', '/', 'PlanetHomePage'],
    ['/learn/mistakes', '/', 'PlanetHomePage'],
    // /dashboard
    ['/dashboard', '/', 'PlanetHomePage'],
    // /practice*
    ['/practice', '/', 'PlanetHomePage'],
    ['/practice/math/fractions/lessons/l-1/result', '/', 'PlanetHomePage'],
    // /question-bank*
    ['/question-bank', '/', 'PlanetHomePage'],
    ['/question-bank/sets/s-1', '/', 'PlanetHomePage'],
    // /classroom*
    ['/classroom', '/', 'PlanetHomePage'],
    ['/classroom/sessions/s-1/room', '/', 'PlanetHomePage'],
    // learning history is gone (#13 point 3)
    ['/learning-history', '/', 'PlanetHomePage'],
    // /chat, /assistant
    ['/chat', '/ask', 'AskPage'],
    ['/assistant', '/ask', 'AskPage'],
    // /profile, /settings/password
    ['/profile', '/me', 'MePage'],
    ['/settings/password', '/me', 'MePage'],
  ])('%s -> %s', (from, pathname, page) => {
    const landed = openAs('student', from)

    expect(landed.pathname).toBe(pathname)
    expect(landed.page).toBe(page)
  })
})

describe('a /chat link that names a conversation opens it in Ask', () => {
  it('carries a conversation id in the path to /ask/:id', () => {
    expect(openAs('student', '/chat/c-42')).toMatchObject({ pathname: '/ask/c-42', page: 'AskPage' })
  })

  it('carries a conversation id in the query to /ask/:id and drops it from the query', () => {
    const landed = openAs('student', '/chat?conversationId=c-42&source=practice-upload')

    expect(landed).toMatchObject({ pathname: '/ask/c-42', search: '?source=practice-upload', page: 'AskPage' })
  })

  it('carries it through /assistant too', () => {
    expect(openAs('student', '/assistant?conversationId=c-7')).toMatchObject({ pathname: '/ask/c-7' })
  })

  it.each([
    ['/chat/..'],
    ['/chat/%2E%2E'],
    ['/chat/%2e'],
    ['/chat?conversationId=..'],
    ['/chat?conversationId=%2E%2E'],
    ['/chat?conversationId=.'],
    ['/chat?conversationId=a%2Fb'],
    ['/chat?conversationId=%3Cscript%3E'],
    ['/assistant?conversationId=..'],
  ])('treats %s as naming no conversation and opens plain /ask', (from) => {
    // `/ask/..` would resolve to the parent and land on `/`.
    expect(openAs('student', from)).toMatchObject({ pathname: '/ask', page: 'AskPage' })
  })

  it('accepts the UUIDs the backend issues', () => {
    const id = '3f2b8c1e-9d4a-4b7e-8a61-0c5d2e7f9a13'
    expect(openAs('student', `/chat/${id}`).pathname).toBe(`/ask/${id}`)
  })

  it('opens plain /ask when the id is empty', () => {
    expect(openAs('student', '/chat?conversationId=').pathname).toBe('/ask')
  })

  it('keeps the practice hand-off in location state', () => {
    const state = { practiceContext: { lessonId: 'l-1' } }
    const landed = openAs('student', { pathname: '/chat', state })

    expect(landed.pathname).toBe('/ask')
    expect(landed.state).toEqual(state)
  })
})

describe('the change-password redirect is for students only', () => {
  it.each(['parent', 'teacher', 'admin', 'organization_admin'] as const)(
    'leaves the page in place for %s',
    (viewer) => {
      expect(openAs(viewer, '/settings/password')).toMatchObject({
        pathname: '/settings/password',
        page: 'ChangePasswordPage',
      })
    },
  )

  it('does not move a student under a forced password change', () => {
    // /me cannot change a password yet, and ProtectedRoute sends a reset
    // account back here: redirecting would loop and lock the student out.
    expect(openAs('student', '/settings/password', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })
})

describe('/assignments', () => {
  it('stays reachable for a student', () => {
    expect(openAs('student', '/assignments')).toMatchObject({
      pathname: '/assignments',
      page: 'StudentAssignmentsPage',
    })
  })
})
