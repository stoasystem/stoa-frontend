/**
 * #401: only a page whose module failed to load reloads the tab.
 *
 * KaTeX's chunk failing reloaded it too, at the first formula of a lesson: the
 * lesson's place, a quiz and an Ask draft live in memory and were lost, and
 * offline the reload landed on the browser's offline page. And because the
 * reload took the failure over, the import came back empty, which was kept as
 * KaTeX: if the reload did not happen, every formula after it stayed plain
 * text, past #345's retry. A formula is meant to stay as written instead, and
 * the next one to try again.
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHUNK_RELOAD_KEY, installChunkReload } from '@/app/chunkReload'
import { lazyPage, type PageComponent } from '@/app/router/lazyPage'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'
import '@/i18n'
import { chunkError, failLikeVite, listeningWindow } from './vitePreloadError'

vi.mock('@/services/monitoring', () => ({ reportFrontendError: vi.fn() }))

/** Lets the pending import settle and React render what came of it. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

let stop: () => void = () => {}

beforeEach(() => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  stop()
  vi.restoreAllMocks()
})

describe('a KaTeX chunk that fails to load', () => {
  afterEach(() => {
    vi.doUnmock('@/components/ui/katexLoader')
    vi.resetModules()
  })

  /** A fresh MathRenderer whose KaTeX load goes as `fails` says until `recover()`. */
  async function mathRendererWhoseLoad(fails: () => Promise<{ default: undefined }>) {
    const counter = { attempts: 0 }
    vi.resetModules()
    vi.doMock('@/components/ui/katexLoader', async () => {
      counter.attempts += 1
      return fails()
    })
    const { MathRenderer } = await import('@/components/ui/MathRenderer')
    // The chunk can be fetched again. Registered anew because Vitest keeps a
    // mocked module that loaded, even an empty one, where a browser whose
    // import failed keeps nothing and fetches it again when asked.
    const recover = () =>
      vi.doMock('@/components/ui/katexLoader', async () => {
        counter.attempts += 1
        return vi.importActual('@/components/ui/katexLoader')
      })
    return { MathRenderer, counter, recover }
  }

  it('does not reload the tab; the formula stays as written and the next one is typeset', async () => {
    const { target, reload } = listeningWindow()
    stop = installChunkReload(target, () => 1_000_000)
    const { MathRenderer, counter, recover } = await mathRendererWhoseLoad(async () => {
      await failLikeVite(chunkError('katexLoader-abc123'))
      // Reached only if a listener took the failure over.
      return { default: undefined }
    })

    const first = render(<MathRenderer>{'area is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(counter.attempts).toBe(1))
    await settle()
    expect(reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull()
    expect(first.container.querySelector('.katex')).toBeNull()
    expect(screen.getByText(/area is \$x\^2\$/)).toBeInTheDocument()
    first.unmount()

    recover()
    const second = render(<MathRenderer>{'then $y^3$'}</MathRenderer>)
    await waitFor(() => expect(second.container.querySelector('.katex')).not.toBeNull())
    expect(counter.attempts).toBe(2)
    expect(reload).not.toHaveBeenCalled()
  })

  it('counts a module that came back empty as a failure, and asks again for the next formula', async () => {
    // What Vite hands over when a listener prevented the failure.
    const { MathRenderer, counter, recover } = await mathRendererWhoseLoad(async () => ({ default: undefined }))

    const first = render(<MathRenderer>{'area is $x^2$'}</MathRenderer>)
    await waitFor(() => expect(counter.attempts).toBe(1))
    await settle()
    expect(first.container.querySelector('.katex')).toBeNull()
    expect(screen.getByText(/area is \$x\^2\$/)).toBeInTheDocument()
    first.unmount()

    recover()
    const second = render(<MathRenderer>{'then $y^3$'}</MathRenderer>)
    await waitFor(() => expect(second.container.querySelector('.katex')).not.toBeNull())
    expect(counter.attempts).toBe(2)
  })
})

describe('a page whose chunk fails to load', () => {
  function renderPage(Page: PageComponent) {
    return render(
      <AppErrorBoundary>
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>
      </AppErrorBoundary>,
    )
  }

  it('reloads the tab once, and not again when the reloaded tab fails the same way', async () => {
    let now = 1_000_000
    const { target, reload } = listeningWindow()
    stop = installChunkReload(target, () => now)
    const load = vi.fn(() => failLikeVite(chunkError()) as Promise<never>)

    const before = renderPage(lazyPage('Page', load))
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
    // It waits for the reload rather than report the failure.
    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    before.unmount()

    // The tab after that reload, two seconds later.
    now += 2_000
    renderPage(lazyPage('Page', load))
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
