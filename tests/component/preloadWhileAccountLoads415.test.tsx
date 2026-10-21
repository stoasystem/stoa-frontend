/**
 * A student's page starts loading while the tab's account is read (#415).
 *
 * After a reload, a role route waits for /auth/me before it renders its page
 * (#250, #274), and the page's code was asked for only then: the star map's
 * 77 kB gzip after a reply that takes 1-3 s on a cold start. Now the page
 * this address shows a student is preloaded while the account loads, when
 * the tab remembers a student or nobody. The preload decides nothing: the
 * screen still waits for the account, and whoever it turns out to be gets
 * their own page.
 *
 * The first part is `lazyPage`'s preload itself, against the real chunk
 * reload; the second the router, with stub pages that record a preload.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { CHUNK_RELOAD_KEY, installChunkReload } from '@/app/chunkReload'
import { AppRoutes } from '@/app/router/AppRoutes'
import { rememberTabAccount, type TabAccount } from '@/lib/tabAccount'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { chunkError, failLikeVite, listeningWindow } from './vitePreloadError'

const preloaded = vi.hoisted(() => [] as string[])

// The router's pages are stubs that record a preload. The first part uses
// the real lazyPage, through `importActual`.
vi.mock('@/app/router/lazyPage', async () => {
  const stub = await import('./lazyPageStub')
  return {
    ...stub,
    lazyPage: (pageName: string) => Object.assign(stub.lazyPage(pageName), { preload: () => preloaded.push(pageName) }),
  }
})

// /auth/me never answers here: the account stays loading until a test sets it.
vi.mock('@/services/auth/authApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/auth/authApi')>()),
  getCurrentUser: vi.fn(() => new Promise(() => {})),
}))

const { lazyPage: realLazyPage } = await vi.importActual<typeof import('@/app/router/lazyPage')>('@/app/router/lazyPage')

/** Lets pending imports settle and React render what came of them. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

beforeEach(() => {
  preloaded.length = 0
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe("a page's preload", () => {
  function Shown() {
    return <p>the page</p>
  }

  it('starts loading the module before the page renders, and the render shows it', async () => {
    const load = vi.fn(async () => ({ Shown }))
    const Page = realLazyPage('Shown', load)

    Page.preload()
    expect(load).toHaveBeenCalledTimes(1)

    render(
      <Suspense fallback={<p>loading</p>}>
        <Page />
      </Suspense>,
    )
    await settle()
    expect(screen.getByText('the page')).toBeInTheDocument()
  })

  it('lets a page that mounts once its module is in render at once, without its fallback', async () => {
    const Page = realLazyPage('Shown', async () => ({ Shown }))
    Page.preload()
    await settle()

    // No settling here: through React.lazy alone the first render is the
    // fallback, which the router's Suspense holds for 300 ms.
    render(
      <Suspense fallback={<p>loading</p>}>
        <Page />
      </Suspense>,
    )
    expect(screen.getByText('the page')).toBeInTheDocument()
    expect(screen.queryByText('loading')).not.toBeInTheDocument()
  })

  describe('that fails', () => {
    let stop = () => {}
    afterEach(() => stop())

    it('reloads nothing, and the page loads afresh when it renders', async () => {
      const { target, reload } = listeningWindow()
      stop = installChunkReload(target)
      const load = vi
        .fn<() => Promise<{ Shown: typeof Shown }>>()
        .mockImplementationOnce(() => failLikeVite(chunkError('Shown-1')) as never)
        .mockResolvedValue({ Shown })
      const Page = realLazyPage('Shown', load)

      Page.preload()
      await settle()
      expect(reload).not.toHaveBeenCalled()

      render(
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>,
      )
      await settle()
      expect(load).toHaveBeenCalledTimes(2)
      expect(screen.getByText('the page')).toBeInTheDocument()
      expect(reload).not.toHaveBeenCalled()
    })

    it('leaves the reload to the render, which still reloads once when its load fails too (#401)', async () => {
      const { target, reload } = listeningWindow()
      stop = installChunkReload(target)
      const load = vi.fn(() => failLikeVite(chunkError('Shown-2')) as never)
      const Page = realLazyPage('Shown', load)

      Page.preload()
      await settle()
      expect(reload).not.toHaveBeenCalled()

      render(
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>,
      )
      await settle()
      expect(reload).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).not.toBeNull()
      expect(screen.getByText('loading')).toBeInTheDocument()
    })
  })
})

describe('the router while the account is read', () => {
  const STUDENT: TabAccount = { id: 'u-1', email: 'mia@example.test', role: 'student' }
  const TEACHER: TabAccount = { id: 'u-2', email: 'tom@example.test', role: 'teacher' }

  /** A reload at `path`: a stored token, and an account that has not come back yet. */
  function reloadAt(path: string, remembered?: TabAccount) {
    if (remembered) rememberTabAccount(remembered)
    useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  function accountArrives(role: CurrentUser['role']) {
    act(() =>
      useAuthStore.setState({
        user: { id: 'u-9', name: 'Reader', email: 'reader@example.test', role } as CurrentUser,
      }),
    )
  }

  const stillLoading = () => screen.getByText(i18n.t('common:status.loadingAccount'))

  it.each([
    ['remembers a student', STUDENT],
    ['remembers nobody', undefined],
  ])("loads the star map's code at / when the tab %s, and still waits for the account", (_, remembered) => {
    reloadAt('/', remembered)

    expect(preloaded).toEqual(['MapHomePage'])
    expect(stillLoading()).toBeInTheDocument()
    expect(screen.queryByTestId('page')).not.toBeInTheDocument()

    accountArrives('student')
    expect(screen.getByTestId('page')).toHaveTextContent('MapHomePage')
  })

  it("loads the page this address shows a student, not the home's", () => {
    reloadAt('/map/maths/fractions', STUDENT)
    expect(preloaded).toEqual(['MapPage'])
    expect(stillLoading()).toBeInTheDocument()
  })

  it('loads nothing for a tab that remembers someone else', () => {
    reloadAt('/', TEACHER)
    expect(preloaded).toEqual([])
    expect(stillLoading()).toBeInTheDocument()
  })

  it("loads nothing where a student's page is not what waits", () => {
    // A teacher's page: a student would be turned away.
    reloadAt('/teacher', STUDENT)
    expect(stillLoading()).toBeInTheDocument()
    cleanup()
    // A public page renders, and loads, at once.
    reloadAt('/privacy', STUDENT)
    expect(screen.getByTestId('page')).toHaveTextContent('PrivacyPage')
    expect(preloaded).toEqual([])
  })

  it('loads nothing ahead for a signed-out tab, or one whose account is in', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('page')).toHaveTextContent('EntryPage')
    cleanup()

    rememberTabAccount(STUDENT)
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Mia', email: STUDENT.email, role: 'student' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('page')).toHaveTextContent('MapHomePage')
    expect(preloaded).toEqual([])
  })

  it('decides nothing: the account that arrives gets its own page', () => {
    reloadAt('/', STUDENT)
    expect(preloaded).toEqual(['MapHomePage'])

    accountArrives('teacher')
    expect(screen.getByTestId('page')).toHaveTextContent('EntryPage')
  })
})
