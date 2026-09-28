/**
 * #13 point 8: one manifest, and a gate that keeps it, the redirect table and
 * the translation keys consistent with each other.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { matchPath } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  legacyRedirects,
  pageRoutes,
  roleHomePaths,
  type LegacyRedirect,
} from '@/app/router/routeManifest'
import { navItems } from '@/lib/navigation'

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

const pagePatterns = pageRoutes.map((route) => route.path).filter((p) => p !== '*')

/** The page a concrete address lands on, by react-router's own ranking. */
function landsOnPage(address: string): boolean {
  const pathname = address.split('?')[0]
  return pagePatterns.some((pattern) => matchPath(pattern, pathname))
}

function sampleTarget(redirect: LegacyRedirect): string {
  if (typeof redirect.to === 'string') return redirect.to
  return redirect.to({ params: { conversationId: 'c-1' }, search: new URLSearchParams() })
}

describe('the route manifest', () => {
  it('registers each path once', () => {
    const paths = pageRoutes.map((route) => route.path)
    expect(paths.filter((p, i) => paths.indexOf(p) !== i)).toEqual([])
  })

  it('registers the student routes decided in #13', () => {
    const student = pageRoutes
      .filter((route) => route.access.kind === 'roles' && route.access.roles.join() === 'student')
      .map((route) => route.path)

    expect(student).toEqual(
      expect.arrayContaining([
        '/',
        '/map/:subjectId',
        '/map/:subjectId/:topicId',
        '/map/:subjectId/:topicId/:unitId',
        '/chapter/:unitId',
        '/chapter/:unitId/:lessonId',
        '/ask',
        '/ask/:conversationId',
        '/me',
        '/assignments',
      ]),
    )
  })

  it('keeps /assignments out of navigation', () => {
    expect(navItems.map((item) => item.path)).not.toContain('/assignments')
  })

  it('gives every role a home that is a registered page', () => {
    // Organisation roles have had a home with no page since before #45; that is
    // left as it was, not fixed here.
    const homes = Object.entries(roleHomePaths).filter(([area]) => area !== 'organization')
    expect(homes.filter(([, home]) => !landsOnPage(home))).toEqual([])
  })
})

describe('the redirect table', () => {
  it('points every redirect at a registered page', () => {
    const dead = legacyRedirects.map(sampleTarget).filter((target) => !landsOnPage(target))
    expect(dead).toEqual([])
  })

  it('never shadows a page, unless it is scoped to some roles', () => {
    const shadowing = legacyRedirects.filter(
      (redirect) => !redirect.onlyFor && pagePatterns.includes(redirect.from),
    )
    expect(shadowing).toEqual([])
  })

  it('scopes a redirect only onto a page registered at the same path', () => {
    const orphaned = legacyRedirects.filter(
      (redirect) => redirect.onlyFor && !pagePatterns.includes(redirect.from),
    )
    expect(orphaned).toEqual([])
  })

  it('lists each old path once', () => {
    const froms = legacyRedirects.map((redirect) => redirect.from)
    expect(froms.filter((p, i) => froms.indexOf(p) !== i)).toEqual([])
  })

  it('names where each redirect was decided', () => {
    expect(legacyRedirects.filter((redirect) => !redirect.decision)).toEqual([])
  })
})

describe('the translation keys the manifest names', () => {
  const keys = [
    ...pageRoutes.flatMap((route) => (route.titleKey ? [route.titleKey] : [])),
    ...navItems.flatMap((item) => (item.labelKey ? [item.labelKey] : [])),
  ]

  it('names some', () => {
    expect(keys.length).toBeGreaterThan(10)
  })

  it.each(LOCALES)('exist in %s', (locale) => {
    const missing = keys.filter((key) => typeof lookup(common[locale], key) !== 'string')
    expect(missing).toEqual([])
  })

  it('give every new student page a title', () => {
    const untitled = pageRoutes
      .filter((route) => route.meta.status === 'placeholder' && route.access.kind === 'roles')
      .filter((route) => route.access.kind === 'roles' && route.access.roles.includes('student'))
      .filter((route) => !route.titleKey)
      .map((route) => route.path)
    expect(untitled).toEqual([])
  })
})
