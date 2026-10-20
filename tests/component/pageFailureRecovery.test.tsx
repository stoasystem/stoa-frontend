/**
 * #272: a page that fails - its module did not load, or it threw while
 * rendering - takes only itself down, and the reader can get it back.
 *
 * - "Try again" loads a failed page's module again (React.lazy alone keeps
 *   the failure for good), and a page never refetches on its own.
 * - The page's error boundary sits in the app shell, inside the route
 *   guards: the top bar stays, a guard's redirect still happens, and moving to
 *   another address clears the error.
 * - A page whose module Vite could not fetch reloads the tab once, never
 *   twice in a row.
 * - The shared date helpers show a dash for a value that is not a date.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHUNK_RELOAD_KEY, CHUNK_RELOAD_WINDOW_MS, installChunkReload, reloadForFailedPage } from '@/app/chunkReload'
import { buildRoutes } from '@/app/router/AppRoutes'
import { lazyPage, RELOAD_GRACE_MS, type PageComponent } from '@/app/router/lazyPage'
import type { PageRoute } from '@/app/router/routeManifest'
import { AppErrorBoundary, PageErrorBoundary } from '@/components/common/AppErrorBoundary'
import { reportFrontendError } from '@/services/monitoring'
import i18n from '@/i18n'
import {
  INVALID_DATE_PLACEHOLDER,
  formatDate,
  formatDateTime,
  formatDayAndMonth,
  formatDayAndTime,
  formatTimeOfDay,
} from '@/lib/formatDateTime'
import { useAuthStore, type CurrentUser } from '@/store/authStore'
import { chunkError, failLikeVite, listeningWindow } from './vitePreloadError'

vi.mock('@/services/monitoring', () => ({ reportFrontendError: vi.fn() }))

/** Lets the pending import settle and React render what came of it. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

function withQueries(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function signInAsStudent() {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('a page whose module failed to load', () => {
  it('loads again on "Try again" and shows the page', async () => {
    let calls = 0
    const load = vi.fn(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(chunkError())
        : Promise.resolve({ Page: () => <p>page loaded</p> })
    })
    const Page = lazyPage('Page', load)

    render(
      <AppErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>
      </AppErrorBoundary>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('page loaded')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('does not fetch again by itself while the failure is shown', async () => {
    const load = vi.fn(() => Promise.reject(chunkError()))
    const Page = lazyPage('Page', load)

    render(
      <AppErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>
      </AppErrorBoundary>,
    )
    await screen.findByRole('button', { name: 'Try again' })
    await settle()
    await settle()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('a page that loaded is not fetched again when a boundary resets', async () => {
    const good = vi.fn(() => Promise.resolve({ Good: () => <p>good page</p> }))
    const Good = lazyPage('Good', good)
    const bad = vi.fn(() => Promise.reject(chunkError()))
    const Bad = lazyPage('Bad', bad)

    render(
      <>
        <Suspense fallback={null}>
          <Good />
        </Suspense>
        <AppErrorBoundary>
          <Suspense fallback={null}>
            <Bad />
          </Suspense>
        </AppErrorBoundary>
      </>,
    )
    expect(await screen.findByText('good page')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await settle()
    expect(good).toHaveBeenCalledTimes(1)
    expect(bad).toHaveBeenCalledTimes(2)
  })
})

describe('a page whose module failed to load, while the tab reloads for it', () => {
  let stop: () => void = () => {}
  beforeEach(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY))
  afterEach(() => stop())

  it('stays loading until the reload instead of failing and reporting it', async () => {
    vi.mocked(reportFrontendError).mockClear()
    const { target, reload } = listeningWindow()
    stop = installChunkReload(target, () => 1_000_000)
    const Page = lazyPage('Page', () => failLikeVite(chunkError()) as Promise<never>)
    render(
      <AppErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>
      </AppErrorBoundary>,
    )
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(reportFrontendError).not.toHaveBeenCalled()
  })
})

describe('a reload for a failed import that never comes (#283–#311 review)', () => {
  let stop: () => void = () => {}
  beforeEach(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY))
  afterEach(() => stop())

  it('stops loading after the grace period and offers "Try again"', async () => {
    const { target, reload } = listeningWindow()
    stop = installChunkReload(target, () => 1_000_000)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let calls = 0
    const load = vi.fn(() => {
      calls += 1
      // The tab started a reload for this failure, which the reader then cancelled.
      return calls === 1
        ? (failLikeVite(chunkError()) as Promise<never>)
        : Promise.resolve({ Page: () => <p>page loaded</p> })
    })
    const Page = lazyPage('Page', load)
    try {
      render(
        <AppErrorBoundary>
          <Suspense fallback={<p>loading</p>}>
            <Page />
          </Suspense>
        </AppErrorBoundary>,
      )
      await act(async () => {
        await vi.advanceTimersByTimeAsync(RELOAD_GRACE_MS - 1)
      })
      expect(reload).toHaveBeenCalledTimes(1)
      expect(screen.getByText('loading')).toBeInTheDocument()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
    } finally {
      vi.useRealTimers()
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('page loaded')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

describe('the page error boundary', () => {
  function Boom(): ReactNode {
    throw new Error('render failed')
  }

  function GoElsewhere() {
    const navigate = useNavigate()
    return <button onClick={() => navigate('/fine')}>go elsewhere</button>
  }

  it('keeps the top bar and clears when the reader moves on', async () => {
    signInAsStudent()
    render(
      withQueries(
        <MemoryRouter initialEntries={['/boom']}>
          <GoElsewhere />
          <Routes>
            <Route
              path="/boom"
              element={
                <PageErrorBoundary>
                  <Boom />
                </PageErrorBoundary>
              }
            />
            <Route
              path="/fine"
              element={
                <PageErrorBoundary>
                  <p>fine page</p>
                </PageErrorBoundary>
              }
            />
          </Routes>
        </MemoryRouter>,
      ),
    )
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('This page could not be shown')).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'go elsewhere' }))
    expect(await screen.findByText('fine page')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  const boomRoute = {
    path: '/boom',
    access: { kind: 'roles', roles: ['student'] },
    page: Object.assign(Boom as PageComponent, { pageName: 'Boom' }),
  } as unknown as PageRoute

  it('is inside the route guards, so a signed-out visitor is still sent to sign-in', async () => {
    render(
      withQueries(
        <MemoryRouter initialEntries={['/boom']}>
          <Routes>
            {buildRoutes([boomRoute], [])}
            <Route path="/login" element={<p>sign-in page</p>} />
          </Routes>
        </MemoryRouter>,
      ),
    )
    expect(await screen.findByText('sign-in page')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('catches a page that throws inside the generated routes, under the shell', async () => {
    signInAsStudent()
    render(
      withQueries(
        <MemoryRouter initialEntries={['/boom']}>
          <Routes>{buildRoutes([boomRoute], [])}</Routes>
        </MemoryRouter>,
      ),
    )
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('a failed page loads afresh after the reader leaves it for a route built differently', async () => {
    signInAsStudent()
    let calls = 0
    const load = vi.fn(() => {
      calls += 1
      return calls === 1
        ? Promise.reject(chunkError())
        : Promise.resolve({ Lesson: () => <p>lesson page</p> })
    })
    const lesson = {
      path: '/lesson',
      access: { kind: 'roles', roles: ['student'] },
      page: lazyPage('Lesson', load),
    } as unknown as PageRoute
    const about = {
      path: '/about',
      access: { kind: 'public' },
      page: Object.assign((() => <p>about page</p>) as PageComponent, { pageName: 'About' }),
    } as unknown as PageRoute
    function Go() {
      const navigate = useNavigate()
      return (
        <>
          <button onClick={() => navigate('/about')}>to about</button>
          <button onClick={() => navigate('/lesson')}>to lesson</button>
        </>
      )
    }
    render(
      withQueries(
        <MemoryRouter initialEntries={['/lesson']}>
          <Go />
          <Suspense fallback={<p>loading</p>}>
            <Routes>{buildRoutes([lesson, about], [])}</Routes>
          </Suspense>
        </MemoryRouter>,
      ),
    )
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'to about' }))
    expect(await screen.findByText('about page')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'to lesson' }))
    expect(await screen.findByText('lesson page')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('also stands around the page shown to a visitor a route refuses', async () => {
    const refused = {
      path: '/members',
      access: { kind: 'roles', roles: ['student'] },
      page: Object.assign((() => <p>members</p>) as PageComponent, { pageName: 'Members' }),
      refusedPage: Object.assign(Boom as PageComponent, { pageName: 'Boom' }),
    } as unknown as PageRoute
    render(
      withQueries(
        <MemoryRouter initialEntries={['/members']}>
          <Routes>{buildRoutes([refused], [])}</Routes>
        </MemoryRouter>,
      ),
    )
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('has its copy in all four languages', () => {
    const keys = ['errorBoundary.pageTitle', 'errorBoundary.pageBody', 'errorBoundary.reload']
    const english = keys.map((key) => i18n.getFixedT('en', 'common')(key))
    for (const language of ['de', 'fr', 'it']) {
      const t = i18n.getFixedT(language, 'common')
      keys.forEach((key, index) => {
        expect(i18n.exists(key, { lng: language, ns: 'common', fallbackLng: [] })).toBe(true)
        expect(t(key)).not.toBe(english[index])
      })
    }
  })
})

describe('vite:preloadError', () => {
  function fakeWindow(storage: Storage = window.sessionStorage) {
    const target = new EventTarget() as EventTarget & { sessionStorage: Storage; location: { reload: () => void } }
    target.sessionStorage = storage
    target.location = { reload: vi.fn() }
    return target
  }

  /** Vite's announcement of a failed import; the import then rejects with `error`. */
  function fire(target: EventTarget, error: Error = chunkError()) {
    const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: error })
    target.dispatchEvent(event)
    return { event, error }
  }

  let stop: () => void = () => {}
  beforeEach(() => sessionStorage.removeItem(CHUNK_RELOAD_KEY))
  afterEach(() => stop())

  it('is never prevented, so the import fails to whoever asked for it, and nothing reloads by itself', () => {
    const target = fakeWindow()
    stop = installChunkReload(target as unknown as Window, () => 1_000_000)

    expect(fire(target).event.defaultPrevented).toBe(false)
    expect(target.location.reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull()
  })

  it('reloads once for a page, and lets the next failure through instead of reloading again', () => {
    let now = 1_000_000
    const target = fakeWindow()
    stop = installChunkReload(target as unknown as Window, () => now)

    expect(reloadForFailedPage(fire(target).error)).toBe(true)
    expect(target.location.reload).toHaveBeenCalledTimes(1)

    // The page after that reload fails the same way.
    now += 2_000
    expect(reloadForFailedPage(fire(target).error)).toBe(false)
    expect(target.location.reload).toHaveBeenCalledTimes(1)

    // A failure long after is a new one.
    now += CHUNK_RELOAD_WINDOW_MS
    expect(reloadForFailedPage(fire(target).error)).toBe(true)
    expect(target.location.reload).toHaveBeenCalledTimes(2)
  })

  it('does not reload for a failure Vite did not announce', () => {
    const target = fakeWindow()
    stop = installChunkReload(target as unknown as Window, () => 1_000_000)

    expect(reloadForFailedPage(new Error('the page threw while its module ran'))).toBe(false)
    expect(reloadForFailedPage('not an error')).toBe(false)
    expect(reloadForFailedPage(undefined)).toBe(false)
    expect(target.location.reload).not.toHaveBeenCalled()
  })

  it('does not reload once it has stopped listening', () => {
    const target = fakeWindow()
    stop = installChunkReload(target as unknown as Window, () => 1_000_000)
    const { error } = fire(target)
    stop()

    expect(reloadForFailedPage(error)).toBe(false)
    expect(reloadForFailedPage(fire(target).error)).toBe(false)
    expect(target.location.reload).not.toHaveBeenCalled()
  })

  it('does not reload when it cannot remember having reloaded', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    const target = fakeWindow(blocked)
    stop = installChunkReload(target as unknown as Window, () => 5)

    expect(reloadForFailedPage(fire(target).error)).toBe(false)
    expect(target.location.reload).not.toHaveBeenCalled()
  })
})

describe('the date helpers', () => {
  const helpers = { formatTimeOfDay, formatDayAndMonth, formatDayAndTime, formatDateTime, formatDate }

  it.each(Object.entries(helpers))('%s shows a dash for a value that is not a date', (_name, helper) => {
    expect(helper('not a date')).toBe(INVALID_DATE_PLACEHOLDER)
    expect(helper(Number.NaN)).toBe(INVALID_DATE_PLACEHOLDER)
    expect(helper(new Date('nope'))).toBe(INVALID_DATE_PLACEHOLDER)
  })

  it.each(Object.entries(helpers))('%s still formats a real date', (_name, helper) => {
    expect(helper('2026-03-05T14:30:00Z')).not.toBe(INVALID_DATE_PLACEHOLDER)
  })
})
