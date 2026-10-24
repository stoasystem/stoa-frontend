/**
 * #454: react-router-dom is pinned to 7.18.4 exactly (the pin itself is held
 * in dependencyAdvisories419). From 7.18.3 on, `navigate()` and `<Navigate>`
 * throw on a target that leaves this site, "External navigation is not
 * allowed" (remix-run/react-router#15446): a `<Navigate>` throws while it
 * renders, so its page falls to the error boundary; a `navigate()` throws out
 * of its click or effect, and nothing moves.
 *
 * So every function that builds an in-app target is driven here with hostile
 * ids: another host in each spelling a browser reads as one, a script URL,
 * dot segments, encodings, values that are not strings. Each target has to be
 * an absolute path on this site. Then every distinct target goes through the
 * pinned router: a `<Link>` to it must point here, and `navigate()` must take
 * it without refusing and hand the browser an address here. A negative
 * control checks the router does refuse a target that leaves, so this harness
 * can see a refusal at all.
 *
 * The legacy redirects and the star card's chapter and review links are also
 * driven through the real components, since that is where their targets are
 * put together.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { act, useEffect, useRef } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter, Link, MemoryRouter, createPath, resolvePath, useLocation, useNavigate, type To } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { askPathFor, legacyRedirects, moderationPathFor } from '@/app/router/routeManifest'
import { NOTIFICATION_TARGETS, notificationTargetPath } from '@/components/notifications/notificationTargets'
import { chapterPath, quizPath, skillPath } from '@/features/chapter/useChapter'
import { StarCard } from '@/features/starmap/components/StarCard'
import { pathForTarget } from '@/features/starmap/view/layers'
import { reviewReturnPath } from '@/features/starmap/view/reviewReturn'
import i18n from '@/i18n'
import { getDefaultRouteForRole, getPostLoginTarget, getReturnPath, getReturnTarget } from '@/lib/authRoutes'
import { getHomePathForUserRole, getStartPracticePath } from '@/lib/navigation'
import type { UserRole } from '@/types/user'
import { openAs } from './routeHarness'
import { skyMap } from './starmapHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

const ROLES: readonly UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

// A role the manifest has no home for: one the backend added first, and
// Object's own keys, which a bare lookup in roleHomePaths would answer.
const UNKNOWN_ROLES = ['guest', 'constructor', 'toString', '__proto__'] as unknown as readonly UserRole[]

/*
 * Another host in front of a page some role may open. A destination check
 * that reads only the parsed path (`canUseNextPathForRole`) lets each of these
 * through, so only the origin check stands between them and the redirect.
 * Behind `/x/%2e%2e`, the parser's `..`, the host is a path here again.
 */
const OTHER_HOSTS = [
  '//evil.example',
  '/\\evil.example',
  '\\\\evil.example',
  '/\t/evil.example',
  'https://evil.example',
  `${window.location.protocol}//${window.location.host}@evil.example`,
  '/x/%2e%2e//evil.example',
]
const PAGES = ['/', '/ask', '/map/math', '/me', '/parent', '/teacher', '/admin', '/organization']

const HOSTILE_STRINGS: readonly string[] = [
  ...OTHER_HOSTS.flatMap((host) => PAGES.map((page) => `${host}${page}`)),
  // Another host, in each spelling a browser reads as one.
  '//evil.example/x',
  '///evil.example/x',
  '/\\evil.example/x',
  '\\/evil.example/x',
  '\\\\evil.example/x',
  '/\t/evil.example/x',
  ' //evil.example/x',
  '\n//evil.example/x',
  'https://evil.example/x',
  'https:\\\\evil.example/x',
  '//evil.example@app.stoaedu.ch/x',
  // A script or a document instead of a page.
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  ' javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'mailto:someone@evil.example',
  // Out of the page's own prefix, and back out at the top.
  '.',
  '..',
  '../..',
  '../../..//evil.example/x',
  '/x/..//evil.example/x',
  '/.//evil.example/x',
  '/map/..//evil.example/x',
  '/map/../\\evil.example/x',
  // Encoded, once and twice.
  '%2F%2Fevil.example',
  '%5C%5Cevil.example',
  '%2e%2e',
  '%252e%252e',
  '/%2F%2Fevil.example',
  '/%5Cevil.example',
  // A query or a fragment where an id goes.
  '?next=//evil.example',
  '#//evil.example',
  // A plain id, and none.
  'u-1',
  '',
]

const HOSTILE: readonly unknown[] = [
  ...HOSTILE_STRINGS,
  undefined,
  null,
  42,
  {},
  ['//evil.example/x'],
  { toString: () => '//evil.example/x' },
]

type Built = { builder: string; input: unknown; to: To | null | undefined }

/** Every target an in-app builder makes from the hostile ids. */
function builtTargets(): Built[] {
  const built: Built[] = []
  const add = (builder: string, input: unknown, to: To | null | undefined) => built.push({ builder, input, to })

  for (const id of HOSTILE) {
    add('askPathFor', id, askPathFor(id))
    add('moderationPathFor', id, moderationPathFor(id))
    add('reviewReturnPath', id, reviewReturnPath(id))
    add('reviewReturnPath', { star: id }, reviewReturnPath({ star: id }))
  }

  const targetTypes = new Set([
    ...Object.values(NOTIFICATION_TARGETS).flatMap((targets) => Object.keys(targets)),
    'constructor',
    '__proto__',
    'toString',
    '//evil.example/x',
  ])
  for (const role of ROLES) {
    for (const targetType of targetTypes) {
      for (const targetId of HOSTILE) {
        const event = { targetType, targetId } as Parameters<typeof notificationTargetPath>[0]
        add(`notificationTargetPath(${role})`, event, notificationTargetPath(event, role))
      }
    }
  }

  for (const id of HOSTILE_STRINGS) {
    add('pathForTarget map', id, pathForTarget(id, { layer: 'map' }))
    add('pathForTarget nebula', id, pathForTarget(id, { layer: 'nebula', nebulaId: id }))
    add('pathForTarget star', id, pathForTarget(id, { layer: 'star', nebulaId: id, unitId: id }))
    add('chapterPath', id, chapterPath(id))
    add('chapterPath lesson', id, chapterPath(id, id))
    add('quizPath', id, quizPath(id, id))
    add('skillPath', id, skillPath(id, id))
    add('reviewReturnPath', { star: `/map/${id}` }, reviewReturnPath({ star: `/map/${id}` }))
  }

  // What AppRoutes' useRedirectTarget hands <Navigate>, for every old route.
  for (const redirect of legacyRedirects) {
    const prefix = redirect.from.replace(/\/(\*|:conversationId)$/, '')
    for (const role of [undefined, ...ROLES]) {
      for (const id of HOSTILE_STRINGS) {
        for (const pathname of [`${prefix}/${id}`, `${prefix}/${encodeURIComponent(id)}`]) {
          const search = new URLSearchParams({ conversationId: id, next: id })
          const input = { params: { conversationId: id, '*': id }, search, pathname, role }
          const to = typeof redirect.to === 'string' ? redirect.to : redirect.to(input)
          add(`legacy ${redirect.from}`, { pathname, role }, to)
          if (redirect.carryContext) add(`legacy ${redirect.from}, context carried`, { pathname, role }, { pathname: to, search: `?${search}`, hash: `#${id}` })
        }
      }
    }
  }

  // The sign-in's destination, the return after a session ended, the forced
  // change's "Continue" to where it was headed, and each role's home.
  for (const role of [...ROLES, ...UNKNOWN_ROLES]) {
    for (const mustChangePassword of [false, true]) {
      const user = { role, mustChangePassword }
      for (const id of HOSTILE) {
        const text = String(id)
        const signIns = [
          { search: `?next=${encodeURIComponent(text)}` },
          { search: `?next=${text}` },
          { search: '', state: { from: { pathname: id, search: id, hash: id } } },
          { search: '', state: { from: { pathname: '/', search: '', hash: `#${text}` } } },
        ]
        for (const location of signIns) {
          const target = getPostLoginTarget(user, location)
          add(`getPostLoginTarget(${role})`, location, target.to)
          if (target.state) {
            add(`Continue after a forced change (${role})`, location, getReturnPath({ role }, createPath(target.state.from)))
          }
        }
        add(`getReturnTarget(${role})`, id, getReturnTarget(user, id as string | undefined).to)
      }
    }
    add('getDefaultRouteForRole', role, getDefaultRouteForRole(role))
    add('getHomePathForUserRole', role, getHomePathForUserRole(role))
    add('getStartPracticePath', role, getStartPracticePath({ role }))
  }
  add('getStartPracticePath', null, getStartPracticePath(null))

  return built
}

/** The address a target names, as text. */
function hrefOf(to: To): string {
  return typeof to === 'string' ? to : createPath(to)
}

/** An absolute path whose address, as a browser reads it, is on this site. */
function staysHere(to: unknown): boolean {
  if (typeof to !== 'string' && (typeof to !== 'object' || to === null)) return false
  const href = hrefOf(to as To)
  return href.startsWith('/') && new URL(href, window.location.origin).origin === window.location.origin
}

function describeBuilt({ builder, input, to }: Built) {
  return `${builder}(${JSON.stringify(input) ?? String(input)}) -> ${JSON.stringify(to) ?? String(to)}`
}

/** One of each target the builders made, in the order first seen. */
function distinctTargets(built: Built[]): To[] {
  const seen = new Map<string, To>()
  for (const { to } of built) {
    if (to === null || to === undefined) continue
    const key = typeof to === 'string' ? to : JSON.stringify(to)
    if (!seen.has(key)) seen.set(key, to)
  }
  return [...seen.values()]
}

function NavigateThrough({ targets, onRefusals }: { targets: readonly To[]; onRefusals: (refusals: string[]) => void }) {
  const navigate = useNavigate()
  // Once: outside a data router `navigate` is a new function after each move.
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    const refusals: string[] = []
    for (const to of targets) {
      try {
        navigate(to)
      } catch (error) {
        refusals.push(`${JSON.stringify(to)}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    onRefusals(refusals)
  }, [navigate, targets, onRefusals])
  return null
}

/** Each target through `navigate()` in the app's own router: what it refused, and what it handed the browser. */
async function navigateThrough(targets: readonly To[]) {
  window.history.replaceState(null, '', '/start/page')
  const pushState = vi.spyOn(window.history, 'pushState')
  let refusals: string[] = []
  await act(async () => {
    render(
      <BrowserRouter>
        <NavigateThrough targets={targets} onRefusals={(found) => (refusals = found)} />
      </BrowserRouter>,
    )
  })
  // jsdom cannot leave the page, so the address alone would not show an
  // attempt to: read what the router asked the browser for.
  const pushed = pushState.mock.calls.map(([, , url]) => new URL(String(url), window.location.href))
  return { refusals, pushed }
}

afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('#454: every in-app target builder keeps hostile ids on this site', () => {
  it('reads an address the way a browser does', () => {
    // Negative control: each of these leaves, or is no address at all.
    for (const to of ['//evil.example/x', '/\\evil.example/x', '\\\\evil.example/x', 'https://evil.example/x', 'javascript:alert(1)', 'u-1', null, 42]) {
      expect(staysHere(to), String(to)).toBe(false)
    }
    expect(staysHere('/map/..//evil.example/x')).toBe(true)
    expect(staysHere({ pathname: '/ask', search: '?next=//evil.example', hash: '#//evil.example' })).toBe(true)
  })

  it('builds only absolute paths on this site', () => {
    const built = builtTargets()
    expect(built.length).toBeGreaterThan(1000)
    // notificationTargetPath and reviewReturnPath answer null for "no target".
    // Undefined is no answer: from 7.18.3 a link or navigate() to it throws.
    const leaving = built.filter(({ to }) => to !== null && !staysHere(to)).map(describeBuilt)
    expect(leaving).toEqual([])
  })

  it('links to each target here', () => {
    const targets = distinctTargets(builtTargets())
    const view = render(
      <MemoryRouter initialEntries={['/start/page']}>
        {targets.map((to, index) => <Link key={index} to={to}>{index}</Link>)}
      </MemoryRouter>,
    )
    const hrefs = [...view.container.querySelectorAll('a')].map((link) => link.getAttribute('href') ?? '')
    expect(hrefs).toHaveLength(targets.length)
    expect(hrefs.filter((href) => !staysHere(href))).toEqual([])
  })

  it('navigates to each target without the router refusing it', async () => {
    const targets = distinctTargets(builtTargets())
    const { refusals, pushed } = await navigateThrough(targets)

    expect(refusals).toEqual([])
    expect(pushed).toHaveLength(targets.length)
    expect(pushed.filter((url) => url.origin !== window.location.origin).map(String)).toEqual([])
  })

  it('refuses a target that leaves, so a refusal above would show', async () => {
    // Negative control: the pinned router throws on each, and hands the browser nothing.
    const elsewhere = ['//evil.example/x', 'https://evil.example/x', 'javascript:alert(1)', 'data:text/html,x', { pathname: '//evil.example/x' }]
    const { refusals, pushed } = await navigateThrough(elsewhere)

    expect(refusals).toHaveLength(elsewhere.length)
    expect(refusals.every((refusal) => refusal.endsWith('External navigation is not allowed'))).toBe(true)
    expect(pushed).toEqual([])
  })
})

describe('#454: the real redirects and links keep hostile ids on this site', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en')
  })

  /*
   * Old addresses, as typed into the address bar, by the role each one serves.
   * Not one with a line break in it: React Router's patterns read `.`, which
   * skips a line break, so such an address matches no route at all (not even
   * the 404) and nothing redirects. That holds on 7.18.2 as well; it is not a
   * way off the site.
   */
  const oldAddresses = HOSTILE_STRINGS.filter((id) => !/[\n\r\u2028\u2029]/.test(id)).flatMap((id) => {
    const segment = encodeURIComponent(id)
    return [
      ['student', `/planet/${segment}`],
      ['student', `/planet/math/${segment}/u-1`],
      ['student', `/chat/${segment}`],
      ['student', `/chat?conversationId=${segment}#${segment}`],
      ['student', `/assistant?conversationId=${segment}`],
      ['parent', `/assistant?conversationId=${segment}`],
      ['teacher', `/tutor/requests/${segment}`],
      ['teacher', `/tutor/${segment}`],
    ] as const
  })

  it('lands every old address on a page', () => {
    // A page rendered, so no <Navigate> on the way threw. Where it landed is
    // the router's own location, already a path here, so it proves nothing more.
    const lost = oldAddresses.flatMap(([role, address]) => {
      const landed = openAs(role, address)
      return landed.page !== null ? [] : [`${role} ${address} -> ${createPath(landed)} (${landed.text})`]
    })
    expect(lost).toEqual([])
  })

  function Where() {
    const { pathname } = useLocation()
    return <output data-where>{pathname}</output>
  }

  it.each(HOSTILE_STRINGS.filter((id) => id !== ''))('opens the chapter and the review of a star whose id is %j, here', (unitId) => {
    const map = skyMap(1000, 'math')
    const base = map.stars.find((candidate) => candidate.state !== 'locked')!
    const star = { ...base, unitId, reviewDue: 2 }
    const nebula = map.nebulae.find((candidate) => candidate.topicId === star.nebulaId)!
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/map/math']}>
          <StarCard map={map} star={star} nebula={nebula} reducedMotion />
          <Where />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const where = () => view.container.querySelector('[data-where]')!.textContent

    const hrefs = [...view.container.querySelectorAll('a')].map((link) => link.getAttribute('href') ?? '')
    expect(hrefs.filter((href) => !staysHere(href))).toEqual([])

    // Each click lands where the router reads its link (`/chapter/..` is `/`):
    // it was taken, not refused. The chapter goes by the jump, StarCard's own navigate().
    const action = { lit: 'open', in_progress: 'continue' }[star.state as string] ?? 'start'
    fireEvent.click(screen.getByRole('link', { name: i18n.t(`starmap:star.${action}`) }))
    expect(where()).toBe(resolvePath(`/chapter/${encodeURIComponent(unitId)}`).pathname)

    fireEvent.click(screen.getByRole('link', { name: i18n.t('starmap:star.review', { count: 2 }) }))
    expect(where()).toBe(resolvePath(`/review/${encodeURIComponent(unitId)}`).pathname)
  })
})
