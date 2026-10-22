/**
 * A page starts loading while the tab's account is read (#415, #456).
 *
 * After a reload, a role route waits for /auth/me before it renders its page
 * (#250, #274), and the page's code was asked for only then: the star map's
 * 77 kB gzip after a reply that takes 1-3 s on a cold start. Now the page
 * this address shows the role the tab remembers is preloaded while the
 * account loads: a student's, a teacher's, a parent's or an administrator's,
 * and a student's when the tab remembers nobody. The preload decides
 * nothing: the screen still waits for the account, and whoever it turns out
 * to be gets their own page.
 *
 * The first part is `lazyPage`'s preload itself, against the real chunk
 * reload; the second the router, with stub pages that record a preload.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { CHUNK_RELOAD_KEY, installChunkReload } from '@/app/chunkReload'
import { AppRoutes } from '@/app/router/AppRoutes'
import { AppErrorBoundary } from '@/components/common/AppErrorBoundary'
import { rememberTabAccount, type TabAccount } from '@/lib/tabAccount'
import { type CurrentUser, normalizeUserRole, useAuthStore } from '@/store/authStore'
import { chunkError, failLikeVite, listeningWindow } from './vitePreloadError'

const preloaded = vi.hoisted(() => [] as string[])

// The router's pages are stubs that record a preload. The first part uses
// the real lazyPage, through `importActual`, and the error boundary's "Try
// again" the real retry.
vi.mock('@/app/router/lazyPage', async (importOriginal) => {
  const stub = await import('./lazyPageStub')
  const actual = await importOriginal<typeof import('@/app/router/lazyPage')>()
  return {
    ...stub,
    retryFailedPageLoads: actual.retryFailedPageLoads,
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

  it('is the load the render takes: one load, and the page waits for it', async () => {
    let arrive: (module: { Shown: typeof Shown }) => void = () => {}
    const load = vi.fn(() => new Promise<{ Shown: typeof Shown }>((resolve) => (arrive = resolve)))
    const Page = realLazyPage('Shown', load)

    Page.preload()
    render(
      <Suspense fallback={<p>loading</p>}>
        <Page />
      </Suspense>,
    )
    await settle()
    // A stylesheet still on its way keeps the page waiting the same way: Vite
    // holds the module's promise until its stylesheets are in.
    expect(screen.getByText('loading')).toBeInTheDocument()

    arrive({ Shown })
    await settle()
    expect(screen.getByText('the page')).toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(1)
  })

  describe('that fails', () => {
    let stop = () => {}
    afterEach(() => stop())

    it('reloads nothing by itself', async () => {
      const { target, reload } = listeningWindow()
      stop = installChunkReload(target)
      const Page = realLazyPage('Shown', () => failLikeVite(chunkError('Shown-1')) as never)

      Page.preload()
      await settle()
      expect(reload).not.toHaveBeenCalled()
      expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBeNull()
    })

    // Vite asks for a page's stylesheet only on its first load in a document,
    // and Chromium keeps a module that failed: a second load would not meet
    // the failure again, and could show the page without its stylesheet
    // (#441 audit). So the render takes the failed load over.
    it('hands its failure to the render, which reloads the tab once (#401) without loading again', async () => {
      const { target, reload } = listeningWindow()
      stop = installChunkReload(target)
      const load = vi
        .fn<() => Promise<{ Shown: typeof Shown }>>()
        .mockImplementationOnce(() => failLikeVite(chunkError('Shown-2')) as never)
        .mockResolvedValue({ Shown })
      const Page = realLazyPage('Shown', load)

      Page.preload()
      await settle()
      render(
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>,
      )
      await settle()
      expect(reload).toHaveBeenCalledTimes(1)
      expect(load).toHaveBeenCalledTimes(1)
      expect(screen.getByText('loading')).toBeInTheDocument()
    })

    it('right after a reload, leaves the page to its error, and "Try again" loads afresh', async () => {
      const { target, reload } = listeningWindow()
      stop = installChunkReload(target)
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const load = vi
        .fn<() => Promise<{ Shown: typeof Shown }>>()
        .mockImplementationOnce(() => failLikeVite(chunkError('Shown-3')) as never)
        .mockResolvedValue({ Shown })
      const Page = realLazyPage('Shown', load)

      Page.preload()
      await settle()
      render(
        <AppErrorBoundary>
          <Suspense fallback={<p>loading</p>}>
            <Page />
          </Suspense>
        </AppErrorBoundary>,
      )
      fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
      expect(await screen.findByText('the page')).toBeInTheDocument()
      expect(load).toHaveBeenCalledTimes(2)
      expect(reload).not.toHaveBeenCalled()
    })
  })
})

describe('the router while the account is read', () => {
  const STUDENT: TabAccount = { id: 'u-1', email: 'mia@example.test', role: 'student' }
  const TEACHER: TabAccount = { id: 'u-2', email: 'tom@example.test', role: 'teacher' }
  /** A tab that remembers an account with `role`, or `nobody`. */
  const remembering = (role: string): TabAccount | undefined =>
    role === 'nobody' ? undefined : { id: `u-${role}`, email: `${role}@example.test`, role }

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

  // Teachers and administrators waited for /auth/me, then for at least 300 ms
  // of skeleton, before their page's code was even asked for (#456).
  it.each([
    ['/teacher', 'teacher', 'TeacherDashboardPage'],
    ['/teacher/requests/r-1', 'teacher', 'TeacherHelpRequestDetailPage'],
    // The tab keeps the role as the account came; a Cognito group name is the same teacher.
    ['/teacher/availability', 'Teachers', 'TeacherAvailabilityPage'],
    ['/admin', 'admin', 'AdminDashboardPage'],
    ['/admin/users', 'admin', 'AdminAccountsPage'],
    ['/admin/curriculum', 'admin', 'AdminCurriculumPage'],
    ['/organization', 'admin', 'OrganizationHomePage'],
    ['/me', 'admin', 'MePage'],
    ['/parent', 'parent', 'ParentDashboardPage'],
    ['/parent/children/c-1/report', 'parent', 'ChildReportPage'],
    ['/organization/learning-operations', 'school_viewer', 'LearningOperationsDashboardPage'],
  ])('loads the page %s shows a remembered %s, and still waits for the account', (path, role, page) => {
    reloadAt(path, remembering(role))

    expect(preloaded).toEqual([page])
    expect(stillLoading()).toBeInTheDocument()
    expect(screen.queryByTestId('page')).not.toBeInTheDocument()

    accountArrives(normalizeUserRole(role))
    expect(screen.getByTestId('page')).toHaveTextContent(page)
  })

  // Their pages read the administrators' copy, which loads on demand (#414):
  // loaded only once the page asked for it, it held the page skeleton up
  // after the account had come (#456 audit).
  it.each([
    ['/admin/system', 'admin'],
    ['/admin/users', 'admin'],
    ['/organization/learning-operations', 'school_viewer'],
  ])("loads the administrators' copy with the page %s shows a remembered %s", (path, role) => {
    const loadNamespaces = vi.spyOn(i18n, 'loadNamespaces')
    reloadAt(path, remembering(role))
    expect(loadNamespaces).toHaveBeenCalledWith(['admin'])
  })

  it.each([
    ['/teacher', 'teacher'],
    ['/organization', 'admin'],
    ['/me', 'admin'],
    ['/', 'student'],
    // A page the tab's role is turned away from.
    ['/admin/users', 'teacher'],
  ])('loads no copy ahead with the page %s shows a remembered %s', (path, role) => {
    const loadNamespaces = vi.spyOn(i18n, 'loadNamespaces')
    reloadAt(path, remembering(role))
    expect(loadNamespaces).not.toHaveBeenCalled()
  })

  it.each([
    // The star map: a teacher at / is sent on to their own home.
    ['/', 'teacher'],
    ['/teacher', 'student'],
    // Remembering nobody counts as a student.
    ['/teacher', 'nobody'],
    ['/admin/users', 'teacher'],
    ['/parent', 'admin'],
    // A teacher's profile is /teacher/profile; /me turns a teacher away.
    ['/me', 'teacher'],
  ])('loads nothing at %s for a tab remembering %s, whom it turns away', (path, role) => {
    reloadAt(path, remembering(role))
    expect(preloaded).toEqual([])
    expect(stillLoading()).toBeInTheDocument()
  })

  it('loads nothing where no page waits for the account', () => {
    // A public page renders, and loads, at once.
    reloadAt('/privacy', remembering('teacher'))
    expect(screen.getByTestId('page')).toHaveTextContent('PrivacyPage')
    expect(preloaded).toEqual([])
    cleanup()
    // A demo surface sends everyone to the 404 while demo surfaces are off.
    reloadAt('/students/s-1/learning-profile', remembering('admin'))
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

  // The reload for a page that failed to load: its document leaves the page's
  // load to the render, as late as before, so a network that is not back yet
  // does not spend it (#441 audit).
  it.each([
    ['/', 'student'],
    ['/teacher', 'teacher'],
    ['/admin/users', 'admin'],
  ])('loads nothing ahead at %s right after this tab reloaded for a failed page', (path, role) => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()))
    reloadAt(path, remembering(role))
    expect(preloaded).toEqual([])
    expect(stillLoading()).toBeInTheDocument()
  })

  it.each([
    ['/', 'student', 'MapHomePage'],
    ['/teacher', 'teacher', 'TeacherDashboardPage'],
  ])('loads ahead at %s again once that reload is long past', (path, role, page) => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now() - 10 * 60_000))
    reloadAt(path, remembering(role))
    expect(preloaded).toEqual([page])
  })

  it('decides nothing: the account that arrives gets its own page', () => {
    reloadAt('/', STUDENT)
    expect(preloaded).toEqual(['MapHomePage'])

    accountArrives('teacher')
    expect(screen.getByTestId('page')).toHaveTextContent('EntryPage')
    cleanup()

    // A tab that remembers a teacher, signed in as a student by now.
    reloadAt('/teacher', TEACHER)
    expect(preloaded).toEqual(['MapHomePage', 'TeacherDashboardPage'])

    accountArrives('student')
    expect(screen.getByTestId('page')).toHaveTextContent('ForbiddenPage')
  })
})
