/**
 * The star map on a return visit (#757): the last sky this browser read for
 * the account is drawn at once while the skeleton is read again, and the stars
 * around one are read beside the skeleton, not after it.
 *
 * - what is kept: the skeleton only, nothing waiting to be celebrated, per
 *   account and language, thrown away in another shape;
 * - signing out forgets it, and a sign-in here forgets every other account's:
 *   A signs in, out, B signs in, and B's first frame is not A's sky;
 * - storage that refuses is no cache: the map waits, as before;
 * - the cached sky is drawn (`provisional`), the server's replaces it, and an
 *   unchanged one hands back the very same stars array (no new scene);
 * - the neighbourhood is read before the skeleton is back when the galaxy is
 *   known (the route, or the cache), and after it on `/` with nothing cached;
 * - only drawing comes from the cache: a cache that says "newcomer" and a
 *   server that says otherwise never brings the first landing.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { KnowledgeMapSourceProvider, keepUnchanged } from '@/features/starmap/readModelSource'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { useStarMapSource, type StarMapRequest } from '@/features/starmap/starMapSource'
import i18n from '@/i18n'
import { forgetCachedSkies, isCachedSkeleton, readCachedSky, SKY_CACHE_FORMAT, skyForCache, writeCachedSky } from '@/lib/skyCache'
import { getKnowledgeMap, getKnowledgeMapStars } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse, KnowledgeMapStar } from '@/types/practice'

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
  getKnowledgeMapStars: vi.fn(),
}))

const getSky = vi.mocked(getKnowledgeMap)
const getStars = vi.mocked(getKnowledgeMapStars)

const A = 'student-a'
const B = 'student-b'

function star(unitId: string, state: KnowledgeMapStar['state'] = 'ready'): KnowledgeMapStar {
  return {
    unitId,
    name: unitId,
    nebulaId: 'zahlen',
    order: 1,
    state,
    progress: 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 2, lessonsDone: 0, nextLesson: null },
  }
}

function sky(name = 'Mathematik', stars: KnowledgeMapStar[] = [star('eins'), star('zwei')]): KnowledgeMapResponse {
  return {
    view: 'skeleton',
    subjectId: 'math',
    galaxies: [{ subjectId: 'math', name, lit: 0, total: stars.length, enrolled: true }],
    nebulae: [{ topicId: 'zahlen', name: 'Zahlen', order: 0, subjectId: 'math' }],
    stars,
    prerequisites: [],
    summary: { lit: 0, total: stars.length, streakDays: 0, score: 0 },
  }
}

/** A request the test answers when it says so: the skeleton on a slow backend. */
function slow<T>() {
  let answer!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    answer = resolve
  })
  return { promise, answer }
}

const request = (subjectId = 'math'): StarMapRequest => ({ subjectId, size: 1000, t: i18n.t, language: 'en', relations: false, longNames: false }) as StarMapRequest

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <KnowledgeMapSourceProvider>{children}</KnowledgeMapSourceProvider>
    </QueryClientProvider>
  )
}

function signedInAs(id: string) {
  useAuthStore.setState({ isAuthenticated: true, user: { id, email: `${id}@t`, name: id, role: 'student', mustChangePassword: false } } as never)
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  sessionStorage.clear()
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  getSky.mockReset()
  getStars.mockReset()
  getStars.mockImplementation(async ({ subjectId } = {}) => ({ subjectId: subjectId ?? 'math', focus: 'eins', stars: [] }))
  signedInAs(A)
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ isAuthenticated: false, user: null } as never)
  localStorage.clear()
  sessionStorage.clear()
})

describe('what is kept', () => {
  it('keeps the skeleton per account and language, without what waits to be celebrated', () => {
    const lit = { ...sky('Mathematik', [star('eins', 'lit'), star('zwei')]), unacknowledgedLit: ['eins'] }
    writeCachedSky(A, 'en', lit)

    const kept = readCachedSky(A, 'en')!
    expect(kept.unacknowledgedLit).toBeUndefined()
    // Drawn as it was before its moment: in progress, never gold from the cache.
    expect(kept.stars.find((s) => s.unitId === 'eins')!.state).toBe('in_progress')
    expect(readCachedSky(B, 'en')).toBeNull()
    expect(readCachedSky(A, 'de')).toBeNull()
  })

  it('does not keep a full sky (a backend before #503), and throws away another shape', () => {
    writeCachedSky(A, 'en', { ...sky(), view: undefined })
    expect(readCachedSky(A, 'en')).toBeNull()

    localStorage.setItem(`stoa.starmap.sky.${A}`, JSON.stringify({ format: SKY_CACHE_FORMAT + 1, language: 'en', sky: sky() }))
    expect(readCachedSky(A, 'en')).toBeNull()
    expect(localStorage.getItem(`stoa.starmap.sky.${A}`)).toBeNull()

    const broken = { ...sky(), stars: [{ unitId: 'eins' }] }
    expect(isCachedSkeleton(broken)).toBe(false)
    localStorage.setItem(`stoa.starmap.sky.${A}`, JSON.stringify({ format: SKY_CACHE_FORMAT, language: 'en', sky: broken }))
    expect(readCachedSky(A, 'en')).toBeNull()
    localStorage.setItem(`stoa.starmap.sky.${A}`, '{not json')
    expect(readCachedSky(A, 'en')).toBeNull()
    expect(isCachedSkeleton(skyForCache(sky()))).toBe(true)
  })

  it('storage that refuses keeps nothing and breaks nothing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => writeCachedSky(A, 'en', sky())).not.toThrow()
    expect(readCachedSky(A, 'en')).toBeNull()
    expect(() => forgetCachedSkies()).not.toThrow()
  })
})

describe('a shared browser (ADR 0003)', () => {
  it('signing out forgets the sky, and a sign-in forgets every other account’s', () => {
    writeCachedSky(A, 'en', sky())
    writeCachedSky(B, 'en', sky('B'))
    useAuthStore.getState().setAuth({ id: B, email: 'b@t', name: 'B', role: 'student' } as never, 'token-b', 'refresh-b')
    expect(readCachedSky(A, 'en')).toBeNull()
    expect(readCachedSky(B, 'en')).not.toBeNull()

    useAuthStore.getState().clearAuth()
    expect(readCachedSky(B, 'en')).toBeNull()
  })

  it('A signs in, out, and B signs in: B’s first frame is not A’s sky', async () => {
    useAuthStore.getState().setAuth({ id: A, email: 'a@t', name: 'A', role: 'student' } as never, 'token-a', 'refresh-a')
    getSky.mockResolvedValueOnce(sky('Sky of A'))
    const first = renderHook(() => useStarMapSource(), { wrapper })
    await waitFor(() => expect(first.result.current.provisional).toBe(false))
    await waitFor(() => expect(readCachedSky(A, 'en')?.galaxies[0].name).toBe('Sky of A'))
    first.unmount()

    useAuthStore.getState().clearAuth()
    client.clear()
    useAuthStore.getState().setAuth({ id: B, email: 'b@t', name: 'B', role: 'student' } as never, 'token-b', 'refresh-b')
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const second = renderHook(() => useStarMapSource(), { wrapper })

    // Nothing to draw yet: the loading screen, not A's sky.
    expect(second.result.current.status).toBe('pending')
    expect(second.result.current.read(request()).subjects).toEqual([])
    await act(async () => pending.answer(sky('Sky of B')))
    await waitFor(() => expect(second.result.current.read(request()).subjects[0]?.name).toBe('Sky of B'))
  })
})

describe('drawing the cached sky', () => {
  it('draws it at once, then the server’s; an unchanged sky keeps its very stars', async () => {
    writeCachedSky(A, 'en', sky())
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    expect(result.current.status).toBe('success')
    expect(result.current.provisional).toBe(true)
    const before = result.current.read(request()).stars
    expect(before.map((s) => s.unitId).sort()).toEqual(['eins', 'zwei'])

    await act(async () => pending.answer(sky()))
    await waitFor(() => expect(result.current.provisional).toBe(false))
    // The same placement, so the engine keeps its scene: no flight, no names fading in again.
    expect(result.current.read(request()).stars).toBe(before)
  })

  it('takes what changed from the server', async () => {
    writeCachedSky(A, 'en', sky())
    getSky.mockResolvedValueOnce(sky('Mathematik', [star('eins', 'lit'), star('zwei')]))
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    await waitFor(() => expect(result.current.provisional).toBe(false))
    expect(result.current.read(request()).stars.find((s) => s.unitId === 'eins')!.state).toBe('lit')
  })

  it('keeps every array that did not change, and only those', () => {
    const cached = sky()
    const fresh = { ...sky(), stars: [star('eins', 'lit'), star('zwei')] }
    const kept = keepUnchanged(fresh, cached)
    expect(kept.galaxies).toBe(cached.galaxies)
    expect(kept.nebulae).toBe(cached.nebulae)
    expect(kept.stars).toBe(fresh.stars)
    expect(keepUnchanged(fresh, null)).toBe(fresh)
  })

  it('a failed read is said, not hidden behind a sky nobody confirmed', async () => {
    writeCachedSky(A, 'en', sky())
    getSky.mockRejectedValueOnce(new Error('down'))
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    expect(result.current.status).toBe('success')
    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('with storage refused, waits for the server as before', async () => {
    writeCachedSky(A, 'en', sky())
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    expect(result.current.status).toBe('pending')
    expect(result.current.provisional).toBe(false)
    await act(async () => pending.answer(sky()))
    await waitFor(() => expect(result.current.status).toBe('success'))
  })
})

describe('the stars around one, beside the skeleton', () => {
  it('are read before the skeleton is back when the route names the galaxy', async () => {
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    act(() => result.current.focus?.({ subjectId: 'math', unitId: null, named: true }))
    await waitFor(() => expect(getStars).toHaveBeenCalledWith({ subjectId: 'math' }))
    expect(result.current.status).toBe('pending')
    await act(async () => pending.answer(sky()))
  })

  it('are read before the skeleton is back when the cached sky names it', async () => {
    writeCachedSky(A, 'en', sky())
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    act(() => result.current.focus?.({ subjectId: 'math', unitId: null }))
    await waitFor(() => expect(getStars).toHaveBeenCalledTimes(1))
    expect(result.current.provisional).toBe(true)
    await act(async () => pending.answer(sky()))
  })

  it('wait for the skeleton on `/` with nothing cached, as before', async () => {
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    act(() => result.current.focus?.({ subjectId: 'math', unitId: null }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(getStars).not.toHaveBeenCalled()
    await act(async () => pending.answer(sky()))
    await waitFor(() => expect(getStars).toHaveBeenCalledTimes(1))
  })
})

describe('only drawing comes from the cache', () => {
  const OWNER = A
  /** The real mathematics knowledge base, as a skeleton: a returning student, some stars lit. */
  function returning(): KnowledgeMapResponse {
    const map = demoClusterMap('en')
    return {
      view: 'skeleton',
      subjectId: 'math',
      galaxies: map.subjects,
      nebulae: map.nebulae.map((nebula) => ({ ...nebula, subjectId: 'math' })),
      stars: (map.stars as KnowledgeMapResponse['stars']).map((s) => ({ ...s, skills: [] })),
      prerequisites: map.prerequisites,
      summary: map.summary,
    }
  }
  /** The same sky as a newcomer's: nothing started, one star recommended. */
  function newcomer(): KnowledgeMapResponse {
    const base = returning()
    const start = base.stars[0].unitId
    return {
      ...base,
      stars: base.stars.map((s) => ({
        ...s,
        state: 'ready' as const,
        progress: 0,
        unlitPrerequisiteIds: [],
        recommendation: s.unitId === start ? { source: 'system' as const, reason: 'start' as const, relatedUnitId: null } : null,
      })),
    }
  }

  function Where() {
    return <output data-testid="where">{useLocation().pathname}</output>
  }

  it('a cache that says "newcomer" and a server that says otherwise: no first landing', async () => {
    sessionStorage.setItem(`stoa.starmap.firstLanding.subject.${OWNER}`, 'math')
    writeCachedSky(OWNER, 'en', newcomer())
    expect(readCachedSky(OWNER, 'en')).not.toBeNull()
    const pending = slow<KnowledgeMapResponse>()
    getSky.mockReturnValueOnce(pending.promise)
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <KnowledgeMapSourceProvider>
            <MemoryRouter initialEntries={['/map/math']}>
              <Routes>
                <Route path="/map/:subjectId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/:topicId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/cluster/:clusterId" element={<StarMapRoute />} />
              </Routes>
              <Where />
            </MemoryRouter>
          </KnowledgeMapSourceProvider>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    // The cached sky is drawn while the server's is on the wire, and nothing is decided on it.
    await waitFor(() => expect(container.querySelector('[data-starmap-stage]')).not.toBeNull())
    expect(container.querySelector('[data-starmap-loading]')).toBeNull()
    expect(container.querySelector('[data-scene-landing], [data-first-landing], [data-cluster-hint]')).toBeNull()
    expect(screen.getByTestId('where').textContent).toBe('/map/math')

    await act(async () => pending.answer(returning()))
    // The server's sky: a student who has started. The hint for a returning student, never the landing.
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).not.toBeNull())
    expect(container.querySelector('[data-cluster-hint]')!.textContent).not.toContain('Your stars are in clusters now')
    expect(container.querySelector('[data-scene-landing], [data-first-landing]')).toBeNull()
    expect(screen.getByTestId('where').textContent).toBe('/map/math')
  })
})
