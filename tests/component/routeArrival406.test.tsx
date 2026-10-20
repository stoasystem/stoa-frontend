/**
 * Moving to another page puts focus on it and says its name (#406).
 *
 * Every page draws its own layout, so a move replaced the top bar too: the
 * link just pressed was gone, focus fell to <body> and a screen reader said
 * nothing. The pages here are stubs in the real app shell
 * (routeArrivalPages.tsx); the guards, the redirects and the route matching
 * are the real ones.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'
import { AppRoutes } from '@/app/router/AppRoutes'
import { RouteArrival } from '@/app/router/RouteArrival'
import i18n from '@/i18n'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { shellReady } from './routeArrivalPages'

vi.mock('@/app/router/lazyPage', () => import('./routeArrivalPages'))
// The bell's own data is not what this is about.
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
// AppRouter's own: it reads the session from the backend and offers demo roles.
vi.mock('@/app/router/AuthBootstrap', () => ({ AuthBootstrap: () => null }))
vi.mock('@/components/dev/RoleSwitcher', () => ({ RoleSwitcher: () => null }))

function account(role: UserRole, options: { mustChangePassword?: boolean } = {}): CurrentUser {
  return {
    id: `u-${role}`,
    name: 'Ada',
    email: 'ada@example.com',
    role,
    mustChangePassword: options.mustChangePassword ?? false,
  } as CurrentUser
}

function signInAs(role: UserRole | 'anonymous' | 'pending', options: { mustChangePassword?: boolean } = {}) {
  if (role === 'anonymous') useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  else if (role === 'pending') useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
  else useAuthStore.setState({ user: account(role, options), accessToken: 'token', isAuthenticated: true })
}

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

function announcer() {
  const region = document.querySelector<HTMLElement>('[data-route-announcer]')
  if (!region) throw new Error('no route announcer in the document')
  return region
}

/** What the live region holds, one entry per announcement still in it. */
const announced = () => [...announcer().children].map((node) => node.textContent)

const name = (key: string) => i18n.t(key, { ns: 'common' })

const heading = (text: string) => screen.getByRole('heading', { level: 1, name: text })

beforeAll(() => shellReady)

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  document.title = ''
  window.history.replaceState(null, '', '/')
})

describe('moving to another page (#406)', () => {
  it('puts focus on the new page’s heading after a press on the navigation', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher/availability')

    await user.click(screen.getByRole('link', { name: name('navigation.requests') }))

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(title).toHaveAttribute('tabindex', '-1')

    // Focusable from code only while it holds focus: Tab on, and it is a
    // plain heading again.
    await user.tab()
    expect(document.activeElement).not.toBe(title)
    expect(title).not.toHaveAttribute('tabindex')
    expect(title).not.toHaveAttribute('data-route-focus')
  })

  it('puts focus on <main> when the new page has no heading', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))

    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
    expect(document.activeElement).toBe(screen.getByRole('main'))
  })

  it('says the new page’s name in the live region', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))

    await waitFor(() => expect(announced()).toEqual([name('navigation.availability')]))
    expect(document.title).toBe(`${name('navigation.availability')} · STOA`)
    expect(announcer()).toHaveAttribute('aria-live', 'polite')
    expect(announcer()).toHaveAttribute('role', 'status')
  })

  it('keeps the live region in the document from the start, outside the pages', () => {
    signInAs('teacher')
    const { container } = openAt('/teacher')

    expect(announcer()).toBeInTheDocument()
    expect(within(container).getByRole('main').contains(announcer())).toBe(false)
  })

  it('says the same name again for the next page that has it', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('link', { name: 'Request one' }))
    await waitFor(() => expect(announced()).toHaveLength(1))
    const first = announcer().firstElementChild

    await user.click(screen.getByRole('link', { name: 'Request two' }))

    // A fresh node with the same words, so a screen reader hears it again.
    await waitFor(() => expect(announcer().firstElementChild).not.toBe(first))
    expect(announced()).toEqual([first?.textContent])
  })

  it('says nothing when only the language changes', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')
    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))
    await waitFor(() => expect(announced()).toHaveLength(1))
    const said = announcer().firstElementChild

    await act(async () => {
      await i18n.changeLanguage('fr')
    })

    await waitFor(() => expect(document.title).toBe(`${name('navigation.availability')} · STOA`))
    expect(announcer().firstElementChild).toBe(said)
  })

  it('keeps focus a page put somewhere itself', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('link', { name: 'Profile' }))

    const field = await waitFor(() => screen.getByRole('textbox', { name: "The page's own field" }))
    expect(document.activeElement).toBe(field)
    expect(heading('TeacherProfilePage')).not.toHaveAttribute('tabindex')
    // The page is still named.
    await waitFor(() => expect(announced()).toEqual([name('routes.teacherProfile.title')]))
  })

  it('keeps focus that was never lost', async () => {
    signInAs('teacher')
    openAt('/teacher')
    const own = document.createElement('button')
    own.textContent = 'Outside the pages'
    document.body.append(own)

    try {
      own.focus()
      await act(async () => {
        screen.getByRole('link', { name: name('navigation.availability') }).click()
      })

      await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
      expect(document.activeElement).toBe(own)
      await waitFor(() => expect(announced()).toEqual([name('navigation.availability')]))
    } finally {
      own.remove()
    }
  })

  it('moves focus on a step back, too', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')
    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))

    await user.click(screen.getByRole('button', { name: 'Back' }))

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('navigation.requests')])
  })
})

describe('what a move to another page leaves alone (#406)', () => {
  it('leaves the first load to the browser', async () => {
    signInAs('teacher')
    openAt('/teacher')

    const title = heading('TeacherDashboardPage')
    await waitFor(() => expect(document.title).toContain('STOA'))
    expect(document.activeElement).toBe(document.body)
    expect(title).not.toHaveAttribute('tabindex')
    expect(announced()).toEqual([])
  })

  it('leaves the redirects of the first load alone', async () => {
    // A guard sending a signed-out visitor to sign in, and a legacy address.
    signInAs('anonymous')
    const signIn = openAt('/teacher')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'EntryPage' })).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)
    expect(announced()).toEqual([])
    signIn.unmount()

    signInAs('teacher')
    openAt('/tutor/availability')
    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)
    expect(announced()).toEqual([])
  })

  it('leaves the star map to itself', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/me')

    await user.click(screen.getByRole('link', { name: 'Star map' }))
    await waitFor(() => expect(heading('MapPage')).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)

    await user.click(screen.getByRole('link', { name: 'A nebula' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'A nebula' })).not.toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)
    expect(heading('MapPage')).not.toHaveAttribute('tabindex')
    expect(screen.getByRole('main')).not.toHaveAttribute('tabindex')
    expect(announced()).toEqual([])

    // Off the map, pages are handled again.
    await user.click(screen.getByRole('link', { name: 'My account' }))
    const title = await waitFor(() => heading('MePage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('studentRoutes.me.title')])

    // Back on the map, the region keeps no name of the page left behind.
    await user.click(screen.getByRole('link', { name: 'Star map' }))
    await waitFor(() => expect(heading('MapPage')).toBeInTheDocument())
    await waitFor(() => expect(announced()).toEqual([]))
    expect(document.activeElement).toBe(document.body)
  })
})

describe('a move that goes through a guard or a redirect (#406)', () => {
  it('settles on the page a redirect leads to, and says it once', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('link', { name: 'Old availability address' }))

    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    expect(announced()).toEqual([name('navigation.availability')])
  })

  it('settles on the sign-in page a guard sends to, and on the one a refused visitor sees at /', async () => {
    const user = userEvent.setup()
    signInAs('anonymous')
    openAt('/support')

    // The account page sends a signed-out visitor to sign in.
    await user.click(screen.getByRole('link', { name: 'My account' }))
    const signIn = await waitFor(() => heading('EntryPage'))
    await waitFor(() => expect(document.activeElement).toBe(signIn))
    expect(announced()).toEqual([name('routes.login.title')])

    // `/` shows the same page to anyone it is not for, with no name of its
    // own: focus still goes there, and the region keeps nothing from before.
    await user.click(screen.getByRole('link', { name: name('navigation.logoHome') }))
    await waitFor(() => expect(document.activeElement).toBe(heading('EntryPage')))
    expect(announced()).toEqual([])
  })

  it('stays on the forced password change, and says it once', async () => {
    const user = userEvent.setup()
    signInAs('teacher', { mustChangePassword: true })
    openAt('/change-password')

    // The guard sends the account straight back.
    await user.click(screen.getByRole('link', { name: 'Teacher home' }))

    const title = await waitFor(() => heading('ChangePasswordPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('routes.changePassword.title')])
  })

  it('waits out a guard’s loading screen and settles on the page behind it', async () => {
    const user = userEvent.setup()
    signInAs('pending')
    openAt('/support')
    await user.click(screen.getByRole('link', { name: 'Teacher home' }))
    await waitFor(() => expect(screen.getByText(name('status.loadingAccount'))).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)
    expect(announced()).toEqual([])

    act(() => useAuthStore.setState({ user: account('teacher') }))

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('navigation.requests')])
  })
})

describe('the app’s router (#406)', () => {
  it('moves focus and says the name on a move from one page to the next', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    window.history.replaceState(null, '', '/teacher')
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppRouter />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(heading('TeacherDashboardPage')).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)

    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    expect(announced()).toEqual([name('navigation.availability')])
  })
})
