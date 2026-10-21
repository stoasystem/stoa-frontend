/**
 * The shell during a forced password change (#412, part 2).
 *
 * An account an administrator has reset can use one page, the change:
 * ProtectedRoute sends every other page back to it, and the backend refuses
 * everything else (the language preference and the notifications included).
 * Before #412 the shell still offered the role's pages, Profile, Change
 * password and the role's extras, and each one bounced back to the change or
 * was refused. Now the bar holds the logo, which leads to the change with the
 * page it carries, and the avatar; the menu holds Language (the screen
 * switches, nothing is stored), Help and Log out.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, type InitialEntry } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountMenu } from '@/components/shell/AccountMenu'
import { AppLayout } from '@/layouts/AppLayout'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const { i18nChangeLanguage } = vi.hoisted(() => ({ i18nChangeLanguage: vi.fn(async () => {}) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: i18nChangeLanguage },
  }),
}))
// The bell's own data is not what this is about; that it asks at all is.
const { notificationsAsked } = vi.hoisted(() => ({ notificationsAsked: vi.fn() }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => {
    notificationsAsked()
    return { data: { items: [] }, isLoading: false, isError: false }
  },
  useUnreadNotificationCountQuery: () => {
    notificationsAsked()
    return { data: 0 }
  },
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/hooks/auth/useSignOut', () => ({ useSignOut: () => ({ signOut: vi.fn(), isSigningOut: false }) }))
const { updateLocale } = vi.hoisted(() => ({ updateLocale: vi.fn() }))
vi.mock('@/hooks/auth/useUpdateLocalePreferenceMutation', () => ({
  useUpdateLocalePreferenceMutation: () => ({ mutate: updateLocale }),
}))

const ROLES: readonly UserRole[] = ['student', 'teacher', 'parent', 'admin', 'organization_admin']

const originalMatchMedia = window.matchMedia
beforeEach(() => {
  notificationsAsked.mockClear()
  updateLocale.mockClear()
  i18nChangeLanguage.mockClear()
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

function emulateWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function signIn(role: UserRole, mustChangePassword: boolean) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role, mustChangePassword } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

const CARRIED = { from: { pathname: '/teacher/requests/r-1', search: '', hash: '' } }
const ON_THE_CHANGE: InitialEntry = { pathname: '/settings/password', state: CARRIED }

let at: { pathname: string; state: unknown } = { pathname: '', state: null }
function Where() {
  const location = useLocation()
  at = { pathname: location.pathname, state: location.state }
  return null
}

function renderShell(role: UserRole, mustChangePassword: boolean, width = 1280, entry: InitialEntry = ON_THE_CHANGE) {
  emulateWidth(width)
  signIn(role, mustChangePassword)
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <AppLayout>
          <p>page</p>
        </AppLayout>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const bar = () => document.querySelector('[data-top-bar]') as HTMLElement

async function openMenu(role: UserRole, mustChangePassword: boolean) {
  signIn(role, mustChangePassword)
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[ON_THE_CHANGE]}>
        <AccountMenu />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'accountMenu.open' }))
  return screen.findByRole('menu')
}

const itemNames = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent)

describe('the account menu under a forced change', () => {
  it.each(ROLES)('offers a reset %s Language, Help and Log out, and no page', async (role) => {
    const menu = await openMenu(role, true)

    // The language item reads its label and the language now shown.
    expect(itemNames(menu)).toEqual([expect.stringMatching(/^language\.label/), 'accountMenu.help', 'actions.logOut'])
    expect(within(menu).getByRole('menuitem', { name: 'accountMenu.help' })).toHaveAttribute('href', '/support')
  })

  it('takes the page the change carries along to Help', async () => {
    const menu = await openMenu('teacher', true)

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'accountMenu.help' }))

    expect(at).toEqual({ pathname: '/support', state: CARRIED })
  })

  it('switches the screen\'s language for a reset account and stores nothing, which the backend would refuse', async () => {
    const menu = await openMenu('parent', true)

    await userEvent.click(within(menu).getByRole('menuitem', { name: /language\.label/ }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'language.french' }))

    expect(i18nChangeLanguage).toHaveBeenCalledWith('fr')
    expect(updateLocale).not.toHaveBeenCalled()
  })

  it('stores the choice once nobody reset the account', async () => {
    const menu = await openMenu('parent', false)

    await userEvent.click(within(menu).getByRole('menuitem', { name: /language\.label/ }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'language.french' }))

    expect(updateLocale).toHaveBeenCalledWith('fr')
  })

  it.each(ROLES)('still offers a %s nobody reset Profile, Language and Change password', async (role) => {
    const menu = await openMenu(role, false)

    expect(itemNames(menu)).toEqual(
      expect.arrayContaining(['navigation.profile', 'actions.changePassword', 'accountMenu.help', 'actions.logOut']),
    )
    expect(within(menu).getByText('language.label')).toBeInTheDocument()
  })
})

describe('the bar under a forced change', () => {
  it.each(['teacher', 'parent'] as const)('gives a reset %s no segmented pages', (role) => {
    renderShell(role, true)

    expect(within(bar()).queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/settings/password'])
  })

  it('puts the segments under the bar on no phone either', () => {
    renderShell('teacher', true, 375)

    expect(screen.queryAllByRole('navigation')).toEqual([])
  })

  it('gives a reset administrator no source list', () => {
    renderShell('admin', true)

    expect(screen.queryAllByRole('navigation')).toEqual([])
    expect(screen.queryAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/settings/password'])
  })

  it.each(ROLES)('shows a reset %s the logo as the way to the change, and no bell', (role) => {
    renderShell(role, true)

    expect(within(bar()).getByRole('link', { name: 'navigation.logoHome' })).toHaveAttribute('href', '/settings/password')
    expect(within(bar()).queryByRole('button', { name: 'notifications.openLabel' })).not.toBeInTheDocument()
    expect(notificationsAsked).not.toHaveBeenCalled()
    expect(within(bar()).getByRole('button', { name: 'accountMenu.open' })).toBeInTheDocument()
  })

  it('leads back from Help to the change with the page the change carries', async () => {
    renderShell('teacher', true, 1280, { pathname: '/support', state: CARRIED })

    await userEvent.click(within(bar()).getByRole('link', { name: 'navigation.logoHome' }))

    expect(at).toEqual({ pathname: '/settings/password', state: CARRIED })
  })

  it('keeps that page when the logo is pressed on the change itself', async () => {
    renderShell('teacher', true)

    await userEvent.click(within(bar()).getByRole('link', { name: 'navigation.logoHome' }))

    expect(at).toEqual({ pathname: '/settings/password', state: CARRIED })
  })

  it.each(['teacher', 'parent', 'admin'] as const)('gives a %s nobody reset the pages, the logo home and the bell', (role) => {
    renderShell(role, false, 1280, `/${role}`)

    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    expect(within(bar()).getByRole('link', { name: 'navigation.logoHome' })).toHaveAttribute('href', `/${role}`)
    expect(within(bar()).getByRole('button', { name: 'notifications.openLabel' })).toBeInTheDocument()
  })
})
