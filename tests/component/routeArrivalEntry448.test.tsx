/**
 * The sign-in page that sends a visitor on as it opens is never "a page on
 * screen" (#448 audit, finding 1).
 *
 * #448 named the sign-in page a refused visitor sees at `/`. A tab that
 * signed out earlier does not join the browser's sign-in as it starts
 * (tabAccount's initializeTab), so at `/` it draws the sign-in form once and
 * joins from EntryPage's effect, in the same flush as the page reports its
 * name. That report ended the first load, and the redirect to the account's
 * home was scrolled, focused and announced as if the reader had moved. The
 * same was true of `/login` opened by a signed-in account, which has always
 * named itself. Here EntryPage and LoginPage are the real ones (the form
 * itself is not what this is about); every other page is a stub.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/app/router/AppRoutes'
import { RouteArrival } from '@/app/router/RouteArrival'
import i18n from '@/i18n'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { shellReady } from './routeArrivalPages'

vi.mock('@/app/router/lazyPage', async () => {
  const stubs = await import('./routeArrivalPages')
  const React = await import('react')
  return {
    ...stubs,
    lazyPage: (pageName: string, load: () => Promise<Record<string, React.ComponentType>>) => {
      if (pageName !== 'EntryPage') return stubs.lazyPage(pageName)
      // The real EntryPage, loaded on demand as in the app.
      const Lazy = React.lazy(() => load().then((module) => ({ default: module[pageName] })))
      return Object.assign((props: object) => React.createElement(Lazy, props), { pageName, preload() {} })
    },
  }
})
vi.mock('@/components/auth/LoginForm', () => ({ LoginForm: () => <form aria-label="sign in" /> }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useAdminNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
// The guard's loading screen, held at "loading" until a test puts the account in.
vi.mock('@/hooks/auth/accountRead', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/auth/accountRead')>()),
  useAccountRead: () => ({ isError: false, fetchStatus: 'fetching', refetch: vi.fn() }),
}))

const teacher = { id: 'u-teacher', name: 'Ada', email: 'ada@example.com', role: 'teacher', mustChangePassword: false } as CurrentUser

function openAt(path: string) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <RouteArrival>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </RouteArrival>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const announced = () =>
  [...(document.querySelector('[data-route-announcer]')?.children ?? [])].map((node) => node.textContent)

const heading = (text: string) => screen.getByRole('heading', { level: 1, name: text })

/** This tab signed out earlier, so it did not join at start-up; the browser has been signed in as the teacher since. */
function signedOutTabInSignedInBrowser() {
  sessionStorage.setItem('stoa_tab_state', JSON.stringify({ reason: 'signed-out' }))
  localStorage.setItem(
    'stoa_sign_in',
    JSON.stringify({ id: 'sign-in-1', accessToken: 'browser-token', account: { id: teacher.id, email: teacher.email, role: 'teacher' } }),
  )
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
}

/** EntryPage joins from its effect (a token, no account yet), and the account read answers. */
async function joinAndReadAccount() {
  await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
  act(() => useAuthStore.setState({ user: teacher }))
  const title = await waitFor(() => heading('TeacherDashboardPage'))
  // Whatever RouteArrival would do has had its microtasks and effects.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30))
  })
  return title
}

function expectFirstLoad(title: HTMLElement) {
  expect(document.activeElement).toBe(document.body)
  expect(title).not.toHaveAttribute('tabindex')
  expect(announced()).toEqual([])
  expect(window.scrollTo).not.toHaveBeenCalled()
}

beforeAll(() => shellReady)

beforeEach(async () => {
  await i18n.changeLanguage('de')
  localStorage.clear()
  sessionStorage.clear()
  vi.spyOn(window, 'scrollTo')
  // Joining tells the backend nothing here.
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204, json: async () => undefined })))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  document.title = ''
})

describe('a sign-in page that sends the visitor on as it opens is still the first load (#448)', () => {
  it('at /, for a tab that joins the browser’s sign-in as it opens', async () => {
    signedOutTabInSignedInBrowser()
    openAt('/')

    expectFirstLoad(await joinAndReadAccount())
  })

  it('at /login, for a tab that joins on its way to a deep link', async () => {
    signedOutTabInSignedInBrowser()
    // The guard sends the tab to sign in, carrying /teacher.
    openAt('/teacher')

    expectFirstLoad(await joinAndReadAccount())
  })

  it('at /login, opened by an account that is signed in', async () => {
    useAuthStore.setState({ user: teacher, accessToken: 'token', isAuthenticated: true })
    openAt('/login')

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30))
    })

    expectFirstLoad(title)
  })

  it('but a sign-in form that stays is a page on screen: a move the app makes from it is a move', async () => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    openAt('/')
    await waitFor(() => expect(document.title).toBe(`${i18n.t('common:routes.login.title')} · STOA`))
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    // Signed in in another tab, as this one shows the form: it joins and goes home.
    act(() => {
      localStorage.setItem(
        'stoa_sign_in',
        JSON.stringify({ id: 'sign-in-2', accessToken: 'browser-token', account: { id: teacher.id, email: teacher.email, role: 'teacher' } }),
      )
      window.dispatchEvent(new StorageEvent('storage', { key: 'stoa_sign_in', storageArea: localStorage }))
    })
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    act(() => useAuthStore.setState({ user: teacher }))

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([i18n.t('common:navigation.requests')])
  })
})
