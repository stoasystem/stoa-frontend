/**
 * #447: what failed to load comes back, and a failure reloads only a tab the
 * reader is still waiting in.
 *
 * - A page whose module or stylesheet failed to load is offered "Reload page"
 *   alone: loaded again in the same document, it could only fail again.
 * - KaTeX's file is asked for again under a new address, so the next formula
 *   is typeset.
 * - A stylesheet Vite could not load is put back before the next page is shown.
 * - A page that fails after the reader went elsewhere reloads nothing, and
 *   loads afresh when it is shown again; offline, it waits for the connection.
 *
 * Chromium's side of it (a failed import kept for the document, Vite's
 * stylesheet `seen` map) is in tests/e2e-dist/chunkFailure.spec.ts.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHUNK_RELOAD_KEY, installChunkReload, reloadForFailedPage, restoreFailedStylesheets } from '@/app/chunkReload'
import { lazyPage, RELOAD_GRACE_MS, type PageComponent } from '@/app/router/lazyPage'
import { PageErrorBoundary } from '@/components/common/AppErrorBoundary'
import i18n from '@/i18n'
import { useAuthStore, type CurrentUser } from '@/store/authStore'
import { chunkError, failLikeVite, goOffline, listeningWindow } from './vitePreloadError'

vi.mock('@/services/monitoring', () => ({ reportFrontendError: vi.fn() }))

const NOW = 1_000_000

/** Lets the pending import settle and React render what came of it. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

/** A page module that loads. */
function loads(pageName = 'Page') {
  return () => Promise.resolve({ [pageName]: () => <p>page loaded</p> } as Record<string, PageComponent>)
}

/** A page load the test settles itself, once per call: failed as Vite does, or loaded. */
function heldLoads() {
  const held: { fail: () => void; succeed: () => void }[] = []
  const load = vi.fn(
    () =>
      new Promise<Record<string, PageComponent>>((resolve, reject) => {
        held.push({
          fail: () => void failLikeVite(chunkError()).then(resolve as never, reject),
          succeed: () => resolve({ Page: () => <p>page loaded</p> }),
        })
      }),
  )
  return { load, held }
}

/** The page as the router shows it: in its error boundary, in the app shell. */
function asPage(page: ReactNode) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PageErrorBoundary>
          <Suspense fallback={<p>loading</p>}>{page}</Suspense>
        </PageErrorBoundary>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** Our last reload was a moment ago: a failure now is the same one again. */
function justReloaded() {
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(NOW - 1_000))
}

let stop: () => void = () => {}
let reload = vi.fn()

beforeEach(() => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const listening = listeningWindow()
  reload = listening.reload
  stop = installChunkReload(listening.target, () => NOW)
})

afterEach(() => {
  stop()
  vi.restoreAllMocks()
  window.history.pushState({}, '', '/')
  document.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => link.remove())
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('a page whose module failed to load', () => {
  it('is offered "Reload page" alone: in this document it would only fail again', async () => {
    justReloaded()
    const load = vi.fn(() => failLikeVite(chunkError()) as Promise<never>)
    render(asPage(createPage(load)))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('This page could not be shown')).toBeInTheDocument()
    expect(within(alert).getByText(/did not finish loading/)).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(within(alert).queryByRole('button', { name: 'Try again' })).toBeNull()
    expect(reload).not.toHaveBeenCalled()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('is offered "Reload page" alone when the reload it asked for never came', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      render(asPage(createPage(() => failLikeVite(chunkError()) as Promise<never>)))
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
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(within(alert).queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('that Vite did not announce (the dev server) is still offered "Try again", which loads it again', async () => {
    let calls = 0
    const load = vi.fn(() => {
      calls += 1
      return calls === 1 ? Promise.reject(chunkError()) : loads()()
    })
    render(asPage(createPage(load)))

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('page loaded')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('has its copy in all four languages, with German in ss', () => {
    const english = i18n.getFixedT('en', 'common')('errorBoundary.pageLoadBody')
    for (const language of ['de', 'fr', 'it']) {
      expect(i18n.exists('errorBoundary.pageLoadBody', { lng: language, ns: 'common', fallbackLng: [] })).toBe(true)
      expect(i18n.getFixedT(language, 'common')('errorBoundary.pageLoadBody')).not.toBe(english)
    }
    expect(i18n.getFixedT('de', 'common')('errorBoundary.pageLoadBody')).not.toMatch(/ß/)
  })
})

describe("KaTeX's file after a failed load", () => {
  const katexLoads = () => ((globalThis as { katexLoads447?: string[] }).katexLoads447 ??= [])

  afterEach(() => {
    vi.doUnmock('@/components/ui/katexLoader')
    vi.resetModules()
    katexLoads().length = 0
  })

  /** A fresh MathRenderer whose plain KaTeX import always fails, as Chromium's does once it has failed. */
  async function mathRendererWhoseImportFails(message: string) {
    const counter = { plain: 0 }
    vi.resetModules()
    vi.doMock('@/components/ui/katexLoader', async () => {
      counter.plain += 1
      throw new TypeError(message)
    })
    const { MathRenderer } = await import('@/components/ui/MathRenderer')
    return { MathRenderer, counter }
  }

  it('is asked for again at the address the failure named, and the next formula is typeset', async () => {
    // The failed file, as Chromium names it. A fixture stands in for it, so
    // the retry can be told from the plain import, which keeps failing.
    // (That the retry's address is a new one, `?retry=1`, Vitest does not
    // show: chunkFailure.spec.ts checks it in Chromium.)
    const file = `${window.location.origin}/tests/component/fixtures/katexLoader-447.ts`
    const { MathRenderer, counter } = await mathRendererWhoseImportFails(
      `Failed to fetch dynamically imported module: ${file}`,
    )

    const first = render(<MathRenderer>{'area is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(counter.plain).toBe(1))
    await settle()
    expect(first.container.querySelector('.katex')).toBeNull()
    first.unmount()

    const second = render(<MathRenderer>{'then $y^3$'}</MathRenderer>)
    await waitFor(() => expect(second.container.querySelector('.katex')).not.toBeNull(), { timeout: 5_000 })
    expect(counter.plain).toBe(1)
    expect(katexLoads()).toEqual([expect.stringMatching(/\/tests\/component\/fixtures\/katexLoader-447\.ts$/)])
  })

  it('is never asked for at an address on another site, whatever the message says', async () => {
    const { MathRenderer, counter } = await mathRendererWhoseImportFails(
      'Failed to fetch dynamically imported module: https://elsewhere.example/assets/katexLoader-abc123.js',
    )

    const first = render(<MathRenderer>{'area is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(counter.plain).toBe(1))
    await settle()
    first.unmount()
    render(<MathRenderer>{'then $y^3$'}</MathRenderer>)
    // The same address again, as before #447.
    await waitFor(() => expect(counter.plain).toBe(2))
    expect(katexLoads()).toEqual([])
  })
})

describe('a stylesheet Vite could not load', () => {
  const STYLESHEET = '/assets/Shared-abc123.css'

  /** As Vite leaves it: its <link> in the head, and the failure announced for the page that needed it. */
  function stylesheetFailed() {
    const dead = document.createElement('link')
    dead.rel = 'stylesheet'
    dead.href = STYLESHEET
    document.head.append(dead)
    void failLikeVite(new Error(`Unable to preload CSS for ${STYLESHEET}`)).catch(() => {})
    return dead
  }

  const linksTo = (href: string) =>
    [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter(
      (link) => link.getAttribute('href') === href,
    )

  it('is put back before the next page is shown, and the page waits for it', async () => {
    const dead = stylesheetFailed()
    render(
      <Suspense fallback={<p>loading</p>}>
        {createPage(loads())}
      </Suspense>,
    )
    await settle()
    expect(screen.getByText('loading')).toBeInTheDocument()
    // A new <link> in the dead one's place.
    expect(dead.isConnected).toBe(false)
    const [fresh] = linksTo(STYLESHEET)
    expect(linksTo(STYLESHEET)).toHaveLength(1)

    fireEvent.load(fresh)
    expect(await screen.findByText('page loaded')).toBeInTheDocument()

    // Back, so the next page does not wait.
    await expect(restoreFailedStylesheets()).resolves.toBeUndefined()
    expect(linksTo(STYLESHEET)).toEqual([fresh])
  })

  it('that fails again fails the page as a load failure, which reloads the tab', async () => {
    stylesheetFailed()
    render(
      <Suspense fallback={<p>loading</p>}>
        {createPage(loads())}
      </Suspense>,
    )
    await settle()
    fireEvent.error(linksTo(STYLESHEET)[0])
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('is the only kind that is put back: a module that failed holds no page up', async () => {
    void failLikeVite(chunkError()).catch(() => {})
    await expect(restoreFailedStylesheets()).resolves.toBeUndefined()
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(0)
  })
})

describe('a page that fails, and where the reader is', () => {
  it('reloads nothing when the reader went elsewhere before it failed, and loads afresh when shown again', async () => {
    window.history.pushState({}, '', '/lesson')
    const { load, held } = heldLoads()
    const Page = lazyPage('Page', load)
    const before = render(asPage(<Page />))
    await settle()

    // The reader went on before the page's module came.
    window.history.pushState({}, '', '/elsewhere')
    before.unmount()
    held[0].fail()
    await settle()
    expect(reload).not.toHaveBeenCalled()

    window.history.pushState({}, '', '/lesson')
    render(asPage(<Page />))
    await settle()
    expect(load).toHaveBeenCalledTimes(2)
    act(() => held[1].succeed())
    expect(await screen.findByText('page loaded')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(reload).not.toHaveBeenCalled()
  })

  it('reloads the tab when the reader is still at its address', async () => {
    window.history.pushState({}, '', '/lesson')
    const { load, held } = heldLoads()
    render(asPage(createPage(load)))
    await settle()
    held[0].fail()
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('waits for the connection while offline, then reloads', async () => {
    const backOnline = goOffline()
    render(asPage(createPage(() => failLikeVite(chunkError()) as Promise<never>)))
    await settle()
    expect(reload).not.toHaveBeenCalled()
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()

    act(() => backOnline())
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('reloads nothing when the connection comes back after the reader left', async () => {
    window.history.pushState({}, '', '/lesson')
    const backOnline = goOffline()
    const view = render(asPage(createPage(() => failLikeVite(chunkError()) as Promise<never>)))
    await settle()

    // As the router does: another address, another page.
    window.history.pushState({}, '', '/elsewhere')
    view.unmount()
    act(() => backOnline())
    await settle()
    expect(reload).not.toHaveBeenCalled()
  })

  it("shows its error at once in the document our reload made, offline or not: there is no reload to wait for", async () => {
    justReloaded()
    goOffline()
    const error = chunkError()
    void failLikeVite(error).catch(() => {})
    await expect(reloadForFailedPage(error, window.location.pathname)).resolves.toBe('failed')
    expect(reload).not.toHaveBeenCalled()
  })
})

function createPage(load: () => Promise<Record<string, PageComponent>>) {
  const Page = lazyPage('Page', load)
  return <Page />
}
