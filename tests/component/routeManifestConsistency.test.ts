/**
 * #21: the consistency gate over the one route manifest (#13 point 8, #45).
 *
 * routeManifest.test.ts, navigationRoutes.test.ts, legacyRedirects.test.tsx
 * and roleShells.test.tsx already cover most of the four points of #21. This
 * file adds what they leave open: every page naming a translation key, every
 * redirect target resolving for the audience it is sent to, every navigation
 * entry (and the pages it covers) admitting exactly the roles of its area,
 * and the path patterns being distinct and naming their parameters alike.
 *
 * The judgement is made here, independently of the code under test: routes
 * are matched with react-router's own `matchRoutes`, and who an `access`
 * admits and which roles an area stands for are written out below rather than
 * read from `routeAccess` or `navAreaForRole`.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  legacyRedirects,
  pageRoutes,
  roleHomePaths,
  type LegacyRedirect,
  type PageRoute,
  type RouteAccess,
} from '@/app/router/routeManifest'
import { navItems } from '@/lib/navigation'
import type { UserRole } from '@/types/user'

const LOCALES = ['de', 'en', 'fr', 'it'] as const
const common = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(path.resolve(__dirname, `../../src/i18n/locales/${locale}/common.json`), 'utf8'),
    ) as Record<string, unknown>,
  ]),
)

function lookup(bundle: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    bundle,
  )
}

/** Which roles each navigation area is shown to (#13 point 6, #52). */
const AREA_ROLES: Record<string, readonly UserRole[]> = {
  student: ['student'],
  parent: ['parent'],
  teacher: ['teacher'],
  admin: ['admin'],
  organization: ['organization_admin', 'school_teacher', 'school_viewer'],
}

/** Whether a signed-in `role` may open a route with `access`. */
function admits(access: RouteAccess, role: UserRole): boolean {
  if (access.kind === 'public' || access.kind === 'signedIn') return true
  if (access.kind === 'roles') return access.roles.includes(role)
  throw new Error(`unknown access ${JSON.stringify(access)}`)
}

/** The page a concrete address lands on, by react-router's own ranking; null for the catch-all. */
const routeObjects = pageRoutes.map((route) => ({ path: route.path, route }))
function pageAt(address: string): PageRoute | null {
  const pathname = address.split('?')[0]
  const matches = matchRoutes(routeObjects, pathname)
  const leaf = matches?.[matches.length - 1]?.route.route
  return leaf && leaf.path !== '*' ? leaf : null
}

// ---------------------------------------------------------------------------
// 1. Translation keys
// ---------------------------------------------------------------------------

/*
 * Pages that name no translation key: neither a `titleKey` nor a translated
 * navigation label. The debt found when #21 was built held 30 of the 48
 * pages; #103 gave every one of them a title, so the list is empty and may
 * only stay that way. A new page must name a key.
 */
const PAGES_WITHOUT_A_KEY: string[] = []

function keysOf(route: PageRoute): string[] {
  return [
    ...(route.titleKey ? [route.titleKey] : []),
    ...(route.nav ?? []).flatMap((nav) => (nav.labelKey ? [nav.labelKey] : [])),
  ]
}

describe('#21 point 1: every page names a translation key, in all four languages', () => {
  it('leaves no page without a key beyond the known list, which only shrinks', () => {
    const withoutKey = pageRoutes.filter((route) => keysOf(route).length === 0).map((route) => route.path)
    expect(withoutKey).toEqual(PAGES_WITHOUT_A_KEY)
  })

  it.each(LOCALES)('gives every key a non-empty phrase in %s', (locale) => {
    const keys = [...new Set(pageRoutes.flatMap(keysOf))]
    const blank = keys.filter((key) => {
      const phrase = lookup(common[locale], key)
      return typeof phrase !== 'string' || phrase.trim() === ''
    })
    expect(blank).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 2. Redirect targets
// ---------------------------------------------------------------------------

/** Concrete old addresses a redirect's `from` pattern stands for. */
function sampleAddresses(from: string): string[] {
  const filled = from.replace(/:(\w+)/g, (_, name: string) => `sample-${name}`)
  if (!filled.endsWith('/*')) return [filled]
  const base = filled.slice(0, -2)
  return [base || '/', `${base}/a`, `${base}/a/b`, `${base}/a/b/c`, `${base}/a/b/c/d`]
}

/** Every role there is, from the areas written out above. */
const EVERY_ROLE: readonly UserRole[] = [...new Set(Object.values(AREA_ROLES).flat())]

/** Where a redirect sends `role` (undefined: nobody signed in) from each sampled address. */
function targetsFor(redirect: LegacyRedirect, role: UserRole | undefined): string[] {
  return sampleAddresses(redirect.from).flatMap((address) => {
    if (typeof redirect.to === 'string') return [redirect.to]
    const to = redirect.to
    const params: Record<string, string> = {}
    for (const name of redirect.from.match(/:(\w+)/g) ?? []) params[name.slice(1)] = `sample-${name.slice(1)}`
    if (redirect.from.endsWith('/*')) params['*'] = address.slice(redirect.from.length - 1)
    const searches = ['', ...(redirect.consumes ?? []).map((name) => `${name}=sample-query`)]
    return searches.map((search) => to({ params, search: new URLSearchParams(search), pathname: address, role }))
  })
}

/** Where a redirect sends anybody at all, signed in or not. */
function targetsOf(redirect: LegacyRedirect): string[] {
  return [undefined, ...EVERY_ROLE].flatMap((role) => targetsFor(redirect, role))
}

/**
 * Who a redirect sends somewhere: `onlyFor`, else the roles its guard admits.
 * A public or signed-in redirect is for every role; a public one is also for
 * visitors who are not signed in, checked on their own below.
 */
function audienceOf(redirect: LegacyRedirect): readonly UserRole[] {
  if (redirect.onlyFor) return redirect.onlyFor
  return redirect.access.kind === 'roles' ? redirect.access.roles : EVERY_ROLE
}

describe('#21 point 2: every redirect lands on a page its audience may open', () => {
  it.each(legacyRedirects.map((redirect) => [redirect.from, redirect] as const))(
    'resolves %s for every sampled address',
    (_from, redirect) => {
      const dead = targetsOf(redirect).filter((target) => pageAt(target) === null)
      expect(dead).toEqual([])
    },
  )

  it('knows every role there is', () => {
    expect([...EVERY_ROLE].sort()).toEqual(
      ['admin', 'organization_admin', 'parent', 'school_teacher', 'school_viewer', 'student', 'teacher'],
    )
  })

  it('never sends its audience to a page that refuses them', () => {
    const refused = legacyRedirects.flatMap((redirect) =>
      audienceOf(redirect).flatMap((role) =>
        targetsFor(redirect, role).flatMap((target) => {
          const page = pageAt(target)
          return page && !admits(page.access, role) ? [`${redirect.from} -> ${target} refuses ${role}`] : []
        }),
      ),
    )
    expect(refused).toEqual([])
  })

  it('never sends a signed-out visitor from a public redirect to a page that needs a sign-in', () => {
    // A redirect that needs a sign-in says so in its own `access`, so the
    // visitor signs in and comes back to it, not to where it would have led.
    const refused = legacyRedirects
      .filter((redirect) => redirect.access.kind === 'public')
      .flatMap((redirect) =>
        targetsFor(redirect, undefined).flatMap((target) => {
          const page = pageAt(target)
          return page && page.access.kind !== 'public' ? [`${redirect.from} -> ${target}`] : []
        }),
      )
    expect(refused).toEqual([])
  })

  it('never lands on another redirect', () => {
    const chained = legacyRedirects.flatMap((redirect) =>
      targetsOf(redirect).filter((target) =>
        legacyRedirects.some(
          (other) => !other.onlyFor && matchRoutes([{ path: other.from }], target.split('?')[0]) !== null,
        ),
      ),
    )
    expect(chained).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 3. Navigation
// ---------------------------------------------------------------------------

describe('#21 point 3: each area\'s navigation only holds pages its roles may open', () => {
  it('knows every area the navigation uses', () => {
    expect(navItems.filter((item) => !AREA_ROLES[item.role])).toEqual([])
    expect(Object.keys(roleHomePaths).filter((area) => !AREA_ROLES[area])).toEqual([])
  })

  it('leads every entry, and every page it covers, to a page open to all of its area\'s roles', () => {
    const wrong = navItems.flatMap((item) =>
      [item.path, ...(item.covers ?? [])].flatMap((target) => {
        const page = pageAt(target)
        if (!page) return [`${item.role}: ${target} is no page`]
        const refused = AREA_ROLES[item.role].filter((role) => !admits(page.access, role))
        return refused.length ? [`${item.role}: ${target} refuses ${refused.join(',')}`] : []
      }),
    )
    expect(wrong).toEqual([])
  })

  it('covers only pages open to exactly the roles of the entry\'s own page', () => {
    const drift = navItems.flatMap((item) => {
      const own = pageAt(item.path)
      return (item.covers ?? []).filter((target) => {
        const covered = pageAt(target)
        return JSON.stringify(covered?.access) !== JSON.stringify(own?.access)
      })
    })
    expect(drift).toEqual([])
  })

  it('sends every area home to a page all of its roles may open', () => {
    const wrong = Object.entries(roleHomePaths).flatMap(([area, home]) => {
      const page = pageAt(home)
      const refused = AREA_ROLES[area].filter((role) => !page || !admits(page.access, role))
      return refused.length ? [`${area}: ${home} refuses ${refused.join(',')}`] : []
    })
    expect(wrong).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 4. Distinct paths, consistent parameter names
// ---------------------------------------------------------------------------

/*
 * The parameter names the manifest uses, one per thing it names. A new name is
 * red until it is added here, so `/chapter/:chapterId` cannot creep in beside
 * `/chapter/:unitId`.
 */
const PARAMETER_NAMES = [
  'childId',
  'conversationId',
  'lessonId',
  'requestId',
  'studentId',
  'subjectId',
  'topicId',
  'unitId',
]

const allPatterns = [...pageRoutes.map((route) => route.path), ...legacyRedirects.map((redirect) => redirect.from)]

function paramsOf(pattern: string): string[] {
  return (pattern.match(/:(\w+)/g) ?? []).map((name) => name.slice(1))
}

/** What react-router tells apart: case, a trailing slash and parameter names are not. */
function shapeOf(pattern: string): string {
  return pattern.toLowerCase().replace(/\/+$/, '').replace(/:\w+/g, ':') || '/'
}

describe('#21 point 4: paths are distinct and name their parameters alike', () => {
  it('registers no two pages react-router cannot tell apart', () => {
    const shapes = pageRoutes.map((route) => shapeOf(route.path))
    const clashes = pageRoutes.filter((_, i) => shapes.indexOf(shapes[i]) !== i).map((route) => route.path)
    expect(clashes).toEqual([])
  })

  it('lists no two redirects react-router cannot tell apart', () => {
    const shapes = legacyRedirects.map((redirect) => shapeOf(redirect.from))
    const clashes = legacyRedirects.filter((_, i) => shapes.indexOf(shapes[i]) !== i).map((redirect) => redirect.from)
    expect(clashes).toEqual([])
  })

  it('uses only the agreed parameter names', () => {
    const unknown = allPatterns.flatMap((pattern) =>
      paramsOf(pattern).filter((name) => !PARAMETER_NAMES.includes(name)).map((name) => `${pattern} :${name}`),
    )
    expect(unknown).toEqual([])
  })

  it('never names one parameter twice in a path', () => {
    const repeated = allPatterns.filter((pattern) => new Set(paramsOf(pattern)).size !== paramsOf(pattern).length)
    expect(repeated).toEqual([])
  })

  it('names the parameter in the same place the same way everywhere', () => {
    // The segments before a parameter (with parameters blanked) say what it names.
    const namesAt = new Map<string, Set<string>>()
    for (const pattern of allPatterns) {
      const segments = pattern.split('/')
      segments.forEach((segment, i) => {
        if (!segment.startsWith(':')) return
        const place = shapeOf(segments.slice(0, i).join('/'))
        namesAt.set(place, (namesAt.get(place) ?? new Set()).add(segment.slice(1)))
      })
    }
    const mixed = [...namesAt].filter(([, names]) => names.size > 1).map(([place, names]) => `${place}/: ${[...names].join(' | ')}`)
    expect(mixed).toEqual([])
  })
})
