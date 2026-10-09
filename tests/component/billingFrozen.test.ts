import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { legacyRedirects, pageRoutes } from '@/app/router/routeManifest'
import { navItems } from '@/lib/navigation'

// Card 007: payments and billing are frozen, so the running app must not offer
// a way in. The judge is not "these four routes were deleted" -- that agrees
// with itself the moment somebody adds a fifth. It reads the route manifest
// the router is generated from and refuses any paid path it finds there.

// `plan(?!et)` rather than `plan`: the student's `/planet` is not a price plan,
// but PlansPage, ChoosePlanPage and planUpgrade still are.
const PAID_VOCABULARY =
  /billing|subscription|checkout|stripe|refund|payment|invoice|price|pricing|plan(?!et)|purchase|charge|coupon|discount|paywall|wallet/i

const MANIFEST_SOURCE = path.resolve(__dirname, '../../src/app/router/routeManifest.ts')

/** Every path the generated router answers: pages and redirects alike. */
function registered(entries: readonly { path: string }[] = pageRoutes) {
  return [...entries.map((entry) => entry.path), ...legacyRedirects.map((redirect) => redirect.from)]
}

describe('card 007: the paid surface is not reachable from the app', () => {
  it('registers no paid route', () => {
    expect(registered().filter((p) => PAID_VOCABULARY.test(p))).toEqual([])
  })

  it('notices a paid route that somebody registers again', () => {
    // Negative control, kept so the check above cannot go quiet.
    const poisoned = registered([...pageRoutes, { path: '/billing' }])

    expect(poisoned.filter((p) => PAID_VOCABULARY.test(p))).toEqual(['/billing'])
  })

  it('still knows a price plan when it sees one, next to the planet', () => {
    // Negative control for the `/planet` exception: it must not blind the
    // check to the plan pages it exists to catch.
    const names = ['PlansPage', 'ChoosePlanPage', 'UpgradePlanPage', 'planUpgrade', '/plans', '/plan']
    expect(names.filter((name) => !PAID_VOCABULARY.test(name))).toEqual([])
    expect(['/planet/:subjectId', 'PlanetHomePage'].filter((name) => PAID_VOCABULARY.test(name))).toEqual([])
  })

  it('does not count a route that is only present as a comment', () => {
    // The page loaders are kept, commented out, on purpose: a comment is not a
    // registration, and this is what says so.
    const source = readFileSync(MANIFEST_SOURCE, 'utf8')

    expect(source).toContain("path: '/billing'")
    expect(registered().filter((p) => PAID_VOCABULARY.test(p))).toEqual([])
  })

  it('offers no paid entry in navigation', () => {
    const paid = navItems.filter(
      (item) => PAID_VOCABULARY.test(item.path) || PAID_VOCABULARY.test(item.label),
    )

    expect(paid).toEqual([])
  })

  it('routes to no paid page under another name', () => {
    const paid = pageRoutes.filter(
      (route) => PAID_VOCABULARY.test(route.page.pageName) || PAID_VOCABULARY.test(route.meta.purpose),
    )

    expect(paid.map((route) => route.path)).toEqual([])
  })
})

// Card 020: the online classroom is withdrawn for a different reason and needs
// the same kind of guard. It has no backend: `liveClassroomService` answers
// every call from an array in the browser tab, sessions vanish on reload, and
// each one names a student "Anna Meier" and a teacher "Anna Keller". Nine routes
// and a primary navigation entry were registered against it, so a signed-in
// student could book a lesson that was never going to happen.
//
// The judge is the same shape as card 007's: not "those nine were removed",
// which agrees with itself the moment somebody adds a tenth, but "no classroom
// page is registered and no classroom entry is offered". Since #45 an old
// student `/classroom*` link redirects to the planet (#13 point 2) -- that is
// the one way the word may appear, and it may only lead to `/`.

const CLASSROOM_PATH = /(^|\/)classroom(\/|$)/i

describe('card 020: the online classroom is not reachable while it has no backend', () => {
  it('registers no classroom page', () => {
    expect(pageRoutes.map((route) => route.path).filter((p) => CLASSROOM_PATH.test(p))).toEqual([])
  })

  it('sends an old classroom link to the planet and nowhere else', () => {
    const classroom = legacyRedirects.filter((redirect) => CLASSROOM_PATH.test(redirect.from))

    expect(classroom.map((redirect) => [redirect.from, redirect.to])).toEqual([['/classroom/*', '/']])
  })

  it('notices a classroom page that somebody registers again', () => {
    // Negative control, so the check above cannot go quiet.
    const poisoned = [...pageRoutes.map((route) => route.path), '/classroom']

    expect(poisoned.filter((p) => CLASSROOM_PATH.test(p))).toEqual(['/classroom'])
  })

  it('keeps the pages, so this is a withdrawal and not a deletion', () => {
    // Second negative control. If the files were gone, the checks above would
    // pass for a reason nobody chose, and unfreezing would mean rewriting the
    // feature rather than restoring a few entries.
    const source = readFileSync(MANIFEST_SOURCE, 'utf8')

    expect(source).toContain('live-classroom/pages/TeacherClassroomQueuePage')
    expect(
      existsSync(path.resolve(__dirname, '../../src/features/live-classroom/pages/StudentClassroomHomePage.tsx')),
    ).toBe(true)
    expect(pageRoutes.map((route) => route.path).filter((p) => CLASSROOM_PATH.test(p))).toEqual([])
  })

  it('offers no classroom entry in navigation', () => {
    const offered = navItems.filter(
      (item) => CLASSROOM_PATH.test(item.path) || /classroom/i.test(item.label),
    )

    expect(offered).toEqual([])
  })
})
