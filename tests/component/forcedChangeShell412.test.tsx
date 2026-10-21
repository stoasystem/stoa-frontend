/**
 * The shell during a forced password change (#412, part 2).
 *
 * An account an administrator has reset can use one page, the change:
 * ProtectedRoute sends every other page back to it, and the backend refuses
 * everything else (the language preference and the notifications included).
 * Before #412 the shell still offered the role's pages, the logo, Profile,
 * Language, Change password and the role's extras, and each one either
 * bounced back to the change or failed. Now the bar holds the logo, not as a
 * link, and the avatar; the menu holds Help and Sign out.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountMenu } from '@/components/shell/AccountMenu'
import { AppLayout } from '@/layouts/AppLayout'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: vi.fn() },
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

const ROLES: readonly UserRole[] = ['student', 'teacher', 'parent', 'admin', 'organization_admin']

const originalMatchMedia = window.matchMedia
beforeEach(() => notificationsAsked.mockClear())
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

function renderShell(role: UserRole, mustChangePassword: boolean, width = 1280) {
  emulateWidth(width)
  signIn(role, mustChangePassword)
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/settings/password']}>
        <AppLayout>
          <p>page</p>
        </AppLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const bar = () => document.querySelector('[data-top-bar]') as HTMLElement

async function openMenu(role: UserRole, mustChangePassword: boolean) {
  signIn(role, mustChangePassword)
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/settings/password']}>
        <AccountMenu />
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
  it.each(ROLES)('offers a reset %s only Help and Sign out', async (role) => {
    const menu = await openMenu(role, true)

    expect(itemNames(menu)).toEqual(['accountMenu.help', 'actions.logOut'])
    expect(within(menu).getByRole('menuitem', { name: 'accountMenu.help' })).toHaveAttribute('href', '/support')
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
    expect(screen.queryAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([])
  })

  it('puts the segments under the bar on no phone either', () => {
    renderShell('teacher', true, 375)

    expect(screen.queryAllByRole('navigation')).toEqual([])
  })

  it('gives a reset administrator no source list', () => {
    renderShell('admin', true)

    expect(screen.queryAllByRole('navigation')).toEqual([])
    expect(screen.queryAllByRole('link')).toEqual([])
  })

  it.each(ROLES)('shows a reset %s the logo, not as a way home, and no bell', (role) => {
    renderShell(role, true)

    expect(within(bar()).getByRole('img', { name: 'STOA' })).toBeInTheDocument()
    expect(within(bar()).queryByRole('link', { name: 'navigation.logoHome' })).not.toBeInTheDocument()
    expect(within(bar()).queryByRole('button', { name: 'notifications.openLabel' })).not.toBeInTheDocument()
    expect(notificationsAsked).not.toHaveBeenCalled()
    expect(within(bar()).getByRole('button', { name: 'accountMenu.open' })).toBeInTheDocument()
  })

  it.each(['teacher', 'parent', 'admin'] as const)('gives a %s nobody reset the pages, the logo home and the bell', (role) => {
    renderShell(role, false)

    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    expect(within(bar()).getByRole('link', { name: 'navigation.logoHome' })).toHaveAttribute('href', `/${role}`)
    expect(within(bar()).getByRole('button', { name: 'notifications.openLabel' })).toBeInTheDocument()
  })
})
