/**
 * Moving to another page puts focus on it and says its name (#406), and
 * opens it at its top (#448).
 *
 * Every page draws its own layout, so a move replaced the top bar too: the
 * link just pressed was gone, focus fell to <body> and a screen reader said
 * nothing. The pages here are stubs in the real app shell
 * (routeArrivalPages.tsx); the guards, the redirects and the route matching
 * are the real ones.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Suspense, type ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useNavigate, type NavigateFunction } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router/AppRouter'
import { AppRoutes } from '@/app/router/AppRoutes'
import { RouteArrival } from '@/app/router/RouteArrival'
import i18n from '@/i18n'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { holdSlowPage, shellReady } from './routeArrivalPages'

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

/** A move made by the app itself, not by a press on the page (a notification, a timer). */
let go: NavigateFunction = () => {
  throw new Error('nothing rendered')
}

function NavigateProbe() {
  go = useNavigate()
  return null
}

/** `beside`: drawn next to the pages, as a dev panel or a dialog's portal is. */
function openAt(path: string, beside?: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        {beside}
        <RouteArrival>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
        </RouteArrival>
        <NavigateProbe />
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

const marked = () => document.querySelectorAll('[data-route-focus]')

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

  it('keeps the heading focusable through a blur that leaves it focused (the window went to the back)', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher/availability')
    await user.click(screen.getByRole('link', { name: name('navigation.requests') }))
    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))

    fireEvent.blur(title)

    expect(document.activeElement).toBe(title)
    expect(title).toHaveAttribute('tabindex', '-1')
    // And still lets go once focus really moves on.
    await user.tab()
    expect(title).not.toHaveAttribute('tabindex')
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

  it('waits for a page that is still loading, and settles once it is shown', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')
    const release = holdSlowPage()

    const pressed = screen.getByRole('link', { name: 'Learning automation' })
    await user.click(pressed)

    // The router keeps the page on screen while the next one loads
    // (startTransition), and nothing is moved or said early.
    expect(heading('TeacherDashboardPage')).toBeInTheDocument()
    expect(document.activeElement).toBe(pressed)
    expect(announced()).toEqual([])

    await act(async () => release())

    const title = await waitFor(() => heading('LearningAutomationConsolePage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('routes.learningAutomation.title')])
  })
})

describe('a page that stays on screen while its path changes (#406)', () => {
  it('leaves the star map to itself across its layers', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/me')
    await user.click(screen.getByRole('link', { name: 'Star map' }))
    await waitFor(() => expect(announced()).toEqual([name('studentRoutes.map.title')]))

    await user.click(screen.getByRole('link', { name: 'A nebula' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'A nebula' })).not.toBeInTheDocument())

    // The map moves focus and speaks for itself (#330); the region keeps no
    // name from before.
    expect(document.activeElement).toBe(document.body)
    expect(marked()).toHaveLength(0)
    await waitFor(() => expect(announced()).toEqual([]))
  })

  it('leaves Ask to itself across its conversations', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/ask')

    await user.click(screen.getByRole('button', { name: 'Conversation one' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Conversation c1' })).toBeInTheDocument())

    // Not the map's heading behind the panel, and no second "Ask".
    expect(document.activeElement).not.toBe(heading('The map behind Ask'))
    expect(marked()).toHaveLength(0)
    expect(announced()).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Back to the list' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conversation one' })).toBeInTheDocument())
    expect(marked()).toHaveLength(0)
    expect(announced()).toEqual([])
  })

  it('leaves focus where it was on a page that only changed its path', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher/requests/r-1')

    await user.click(screen.getByRole('link', { name: 'Request two' }))

    await waitFor(() => expect(document.title).toContain('STOA'))
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Request two' }))
    expect(announced()).toEqual([])
  })

  it('handles the map like any page when the reader arrives from elsewhere', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/me')

    await user.click(screen.getByRole('link', { name: 'Star map' }))

    const title = await waitFor(() => heading('MapPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('studentRoutes.map.title')])

    // Off the map again, and back to the account page.
    await user.click(screen.getByRole('link', { name: 'My account' }))
    const account = await waitFor(() => heading('MePage'))
    await waitFor(() => expect(document.activeElement).toBe(account))
    expect(announced()).toEqual([name('studentRoutes.me.title')])
  })

  it('handles a nebula chosen on the home map, which is another page than the nebula’s', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/')

    await user.click(screen.getByRole('link', { name: 'A nebula' }))

    const title = await waitFor(() => heading('MapPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('studentRoutes.nebula.title')])
  })
})

describe('the first load (#406)', () => {
  it('is left to the browser', async () => {
    signInAs('teacher')
    openAt('/teacher')

    const title = heading('TeacherDashboardPage')
    await waitFor(() => expect(document.title).toContain('STOA'))
    expect(document.activeElement).toBe(document.body)
    expect(title).not.toHaveAttribute('tabindex')
    expect(announced()).toEqual([])
  })

  it('leaves the redirects it goes through alone', async () => {
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

  it('is still loading when a key is pressed on a loading screen', async () => {
    signInAs('pending')
    openAt('/tutor/availability')
    await waitFor(() => expect(screen.getByText(name('status.loadingAccount'))).toBeInTheDocument())

    fireEvent.keyDown(window, { key: 'Shift' })
    act(() => useAuthStore.setState({ user: account('teacher') }))

    // The account is in, and the legacy address forwards: still the first load.
    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
    expect(document.activeElement).toBe(document.body)
    expect(announced()).toEqual([])
  })

  it('ends with a page on screen: a session ended elsewhere is a move, with no key pressed here', async () => {
    signInAs('teacher')
    openAt('/teacher')
    await waitFor(() => expect(document.title).toContain('STOA'))

    // Signed out in another tab: the guard sends this one to sign in.
    act(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

    const signIn = await waitFor(() => heading('EntryPage'))
    await waitFor(() => expect(document.activeElement).toBe(signIn))
    expect(announced()).toEqual([name('routes.login.title')])
  })

  it('ends on the page its redirects lead to', async () => {
    signInAs('teacher')
    openAt('/tutor/availability')
    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())

    act(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

    const signIn = await waitFor(() => heading('EntryPage'))
    await waitFor(() => expect(document.activeElement).toBe(signIn))
  })

  it('ends with a click alone on a page with no name, as a screen reader’s browse mode sends', async () => {
    // Every page of the manifest reports a name since #448 named the sign-in
    // page a refused visitor sees at `/`; one that does not is drawn here.
    function Unnamed() {
      const navigate = useNavigate()
      return (
        <main>
          <h1>No name of its own</h1>
          <button type="button" onClick={() => navigate('/next', { replace: true })}>
            Replace
          </button>
        </main>
      )
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteArrival>
          <Routes>
            <Route element={<Unnamed />} path="/" />
            <Route element={<main><h1>The next page</h1></main>} path="/next" />
          </Routes>
        </RouteArrival>
      </MemoryRouter>,
    )

    act(() => {
      screen.getByRole('button', { name: 'Replace' }).click()
    })

    const title = await waitFor(() => heading('The next page'))
    await waitFor(() => expect(document.activeElement).toBe(title))
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

  it('looks for the heading in the pages only, not beside them', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher', <h1>Beside the pages</h1>)

    // The redirect's own step has no page: the heading beside it must not settle it.
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

    // `/` shows the same page to anyone it is not for, under the same name
    // (#448): said again, in a fresh node.
    const first = announcer().firstElementChild
    await user.click(screen.getByRole('link', { name: name('navigation.logoHome') }))
    await waitFor(() => expect(document.activeElement).toBe(heading('EntryPage')))
    await waitFor(() => expect(announcer().firstElementChild).not.toBe(first))
    expect(announced()).toEqual([name('routes.login.title')])
    expect(document.title).toBe(`${name('routes.login.title')} · STOA`)
  })

  it('stays on the forced password change, and says it each time the guard sends it back', async () => {
    const user = userEvent.setup()
    signInAs('teacher', { mustChangePassword: true })
    openAt('/change-password')

    // The guard sends the account straight back.
    await user.click(screen.getByRole('link', { name: 'Teacher home' }))

    const title = await waitFor(() => heading('ChangePasswordPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('routes.changePassword.title')])
    const first = announcer().firstElementChild

    await user.click(screen.getByRole('link', { name: 'Teacher home' }))

    // The same words again, in a fresh node, so a screen reader hears them again.
    await waitFor(() => expect(announcer().firstElementChild).not.toBe(first))
    expect(announced()).toEqual([name('routes.changePassword.title')])
    await waitFor(() => expect(document.activeElement).toBe(heading('ChangePasswordPage')))
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

  it('lets the page behind a loading screen set its own focus first', async () => {
    const user = userEvent.setup()
    signInAs('pending')
    openAt('/support')
    await user.click(screen.getByRole('link', { name: 'Profile' }))
    await waitFor(() => expect(screen.getByText(name('status.loadingAccount'))).toBeInTheDocument())

    act(() => useAuthStore.setState({ user: account('teacher') }))

    const field = await waitFor(() => screen.getByRole('textbox', { name: "The page's own field" }))
    await waitFor(() => expect(announced()).toEqual([name('routes.teacherProfile.title')]))
    expect(document.activeElement).toBe(field)
  })

  it('never settles a later visit on a name an earlier visit reported', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')
    await user.click(screen.getByRole('link', { name: 'Request one' }))
    await waitFor(() => expect(announced()).toEqual([name('routes.helpRequest.title')]))

    // The account is read again: every page of the role waits on the loading screen.
    act(() => useAuthStore.setState({ user: null }))
    await waitFor(() => expect(screen.getByText(name('status.loadingAccount'))).toBeInTheDocument())
    act(() => go('/teacher'))
    act(() => go('/teacher/requests/r-1'))
    const said = announcer().firstElementChild

    // Nothing is said over the loading screen...
    await act(async () => {})
    expect(announcer().firstElementChild).toBe(said)

    // ...and the page is settled when it is shown.
    act(() => useAuthStore.setState({ user: account('teacher') }))
    const title = await waitFor(() => heading('TeacherHelpRequestDetailPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announcer().firstElementChild).not.toBe(said)
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

/** The calls to window.scrollTo and the moves of focus, in the order they came. */
function watchScrollAndFocus() {
  const log: string[] = []
  vi.spyOn(window, 'scrollTo').mockImplementation((...args: unknown[]) => {
    log.push(`scroll ${JSON.stringify(args)}`)
  })
  const focused = (event: FocusEvent) => log.push(`focus ${(event.target as HTMLElement).textContent}`)
  document.addEventListener('focusin', focused)
  return {
    log,
    scrolls: () => log.filter((entry) => entry.startsWith('scroll ')),
    stop: () => document.removeEventListener('focusin', focused),
  }
}

const TO_TOP = `scroll ${JSON.stringify([{ top: 0, left: 0, behavior: 'instant' }])}`

describe('a new page starts at its top (#448)', () => {
  let watch: ReturnType<typeof watchScrollAndFocus>

  beforeEach(() => {
    watch = watchScrollAndFocus()
  })

  afterEach(() => {
    watch.stop()
    vi.restoreAllMocks()
  })

  it('scrolls to the top on a link to another page, before its heading takes focus', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher/availability')

    await user.click(screen.getByRole('link', { name: name('navigation.requests') }))

    await waitFor(() => expect(document.activeElement).toBe(heading('TeacherDashboardPage')))
    expect(watch.scrolls()).toEqual([TO_TOP])
    expect(watch.log.slice(watch.log.indexOf(TO_TOP))).toEqual([TO_TOP, 'focus TeacherDashboardPage'])
  })

  it('scrolls to the top on a replace the reader makes, and on the page a redirect leads to', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')

    await user.click(screen.getByRole('button', { name: 'Replace with support' }))
    await waitFor(() => expect(document.activeElement).toBe(heading('SupportPage')))
    expect(watch.scrolls()).toEqual([TO_TOP])

    watch.log.length = 0
    await user.click(screen.getByRole('link', { name: 'Old availability address' }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    // Once for the old address, once for the page it leads to.
    expect(watch.scrolls()).toEqual([TO_TOP, TO_TOP])
  })

  it('leaves a step back to the browser', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    openAt('/teacher')
    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    watch.log.length = 0

    await user.click(screen.getByRole('button', { name: 'Back' }))

    // Focus still moves (#406); the scroll is the browser's to give back.
    await waitFor(() => expect(document.activeElement).toBe(heading('TeacherDashboardPage')))
    expect(watch.scrolls()).toEqual([])
  })

  it('leaves a page that stays on screen where it is: the map’s layers, Ask’s conversations', async () => {
    const user = userEvent.setup()
    signInAs('student')
    const map = openAt('/map/s1')
    await user.click(screen.getByRole('link', { name: 'A nebula' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'A nebula' })).not.toBeInTheDocument())
    expect(watch.scrolls()).toEqual([])
    map.unmount()

    openAt('/ask')
    await user.click(screen.getByRole('button', { name: 'Conversation one' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: 'Conversation c1' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Back to the list' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conversation one' })).toBeInTheDocument())
    expect(watch.scrolls()).toEqual([])
  })

  it('leaves the first load and its redirects alone', async () => {
    signInAs('anonymous')
    const guard = openAt('/teacher')
    await waitFor(() => expect(heading('EntryPage')).toBeInTheDocument())
    guard.unmount()

    signInAs('teacher')
    const legacy = openAt('/tutor/availability')
    await waitFor(() => expect(screen.getByText('A page without a heading.')).toBeInTheDocument())
    legacy.unmount()

    // `/` sends a signed-in teacher home.
    openAt('/')
    await waitFor(() => expect(heading('TeacherDashboardPage')).toBeInTheDocument())

    expect(watch.scrolls()).toEqual([])
  })

  it('lets a page that scrolls itself on arrival have the last word (the account page’s #password)', async () => {
    const user = userEvent.setup()
    signInAs('student')
    openAt('/assignments')

    await user.click(screen.getByRole('link', { name: 'Change password' }))

    const section = await waitFor(() => screen.getByRole('heading', { level: 2, name: 'Password' }))
    await waitFor(() => expect(document.activeElement).toBe(section))
    expect(watch.scrolls()).toEqual([TO_TOP, `scroll ${JSON.stringify([0, 640])}`])
    expect(heading('MePage')).not.toHaveAttribute('tabindex')
  })

  it('scrolls to the top in the app’s own router', async () => {
    const user = userEvent.setup()
    signInAs('teacher')
    window.history.replaceState(null, '', '/teacher')
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AppRouter />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(heading('TeacherDashboardPage')).toBeInTheDocument())
    expect(watch.scrolls()).toEqual([])

    await user.click(screen.getByRole('link', { name: name('navigation.availability') }))

    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    expect(watch.scrolls()).toEqual([TO_TOP])
  })
})

describe('the sign-in page a refused visitor sees at / (#448)', () => {
  it('is named in the title bar on the first load, and nothing is said', async () => {
    signInAs('anonymous')
    openAt('/')

    await waitFor(() => expect(document.title).toBe(`${name('routes.login.title')} · STOA`))
    expect(heading('EntryPage')).toBeInTheDocument()
    expect(document.activeElement).toBe(document.body)
    expect(announced()).toEqual([])
  })

  it('is said after a move from another page, with focus on its heading', async () => {
    const user = userEvent.setup()
    signInAs('anonymous')
    openAt('/support')
    await waitFor(() => expect(document.title).toBe(`${name('routes.support.title')} · STOA`))

    await user.click(screen.getByRole('link', { name: name('navigation.logoHome') }))

    await waitFor(() => expect(document.activeElement).toBe(heading('EntryPage')))
    expect(announced()).toEqual([name('routes.login.title')])
    expect(document.title).toBe(`${name('routes.login.title')} · STOA`)
  })

  it('ends the first load, as any page on screen does: a move the app makes from it is a move', async () => {
    signInAs('anonymous')
    openAt('/')
    await waitFor(() => expect(document.title).toBe(`${name('routes.login.title')} · STOA`))

    // No key, pointer or click here: its name alone says a page was shown.
    act(() => go('/support', { replace: true }))

    const title = await waitFor(() => heading('SupportPage'))
    await waitFor(() => expect(document.activeElement).toBe(title))
    expect(announced()).toEqual([name('routes.support.title')])
  })

  it('is not named to a signed-in visitor it sends home: that redirect is still the first load', async () => {
    signInAs('teacher')
    openAt('/')

    const title = await waitFor(() => heading('TeacherDashboardPage'))
    await waitFor(() => expect(document.title).toBe(`${name('navigation.requests')} · STOA`))
    expect(document.activeElement).toBe(document.body)
    expect(title).not.toHaveAttribute('tabindex')
    expect(announced()).toEqual([])
  })
})
