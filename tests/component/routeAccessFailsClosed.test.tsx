/**
 * An `access` the router does not know is refused loudly, never read as
 * "any signed-in account". The types rule it out; these cast past them, the
 * way a bad merge or a hand-edited entry would.
 */
import { describe, expect, it } from 'vitest'
import { accessKey, buildRoutes, isAdmitted } from '@/app/router/AppRoutes'
import { pageRoutes, type PageRoute, type RouteAccess } from '@/app/router/routeManifest'

const bogus = { kind: 'teachersAndFriends' } as unknown as RouteAccess
const student = { role: 'student' as const }
const tutorPage = pageRoutes.find((route) => route.path === '/tutor') as PageRoute
const rootPage = pageRoutes.find((route) => route.path === '/') as PageRoute

describe('an unknown access kind', () => {
  it('is refused by accessKey', () => {
    expect(() => accessKey(bogus)).toThrow(/unknown access/)
  })

  it('is refused by the admission check behind /', () => {
    expect(() => isAdmitted(bogus, student, true)).toThrow(/unknown access/)
  })

  it('stops the router being built from a page entry', () => {
    expect(() => buildRoutes([{ ...tutorPage, access: bogus }], [])).toThrow(/unknown access/)
  })

  it('stops the router being built from a refused-page entry', () => {
    expect(() => buildRoutes([{ ...rootPage, access: bogus }], [])).toThrow(/unknown access/)
  })

  it('stops the router being built from a redirect', () => {
    expect(() => buildRoutes([], [{ from: '/old', to: '/', access: bogus, decision: 'test' }])).toThrow(
      /unknown access/,
    )
  })

  it('leaves the real manifest buildable', () => {
    expect(buildRoutes().length).toBeGreaterThan(0)
  })
})

describe('the known access kinds', () => {
  it('admit as the guards do', () => {
    expect(isAdmitted({ kind: 'public' }, null, false)).toBe(true)
    expect(isAdmitted({ kind: 'signedIn' }, null, true)).toBe(false)
    expect(isAdmitted({ kind: 'signedIn' }, student, true)).toBe(true)
    expect(isAdmitted({ kind: 'roles', roles: ['teacher'] }, student, true)).toBe(false)
    expect(isAdmitted({ kind: 'roles', roles: ['student'] }, student, true)).toBe(true)
    expect(isAdmitted({ kind: 'roles', roles: ['student'] }, student, false)).toBe(false)
  })
})
