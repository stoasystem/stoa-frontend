/**
 * The avatar menu (#13 point 4, #46, built in #18): five fixed items for every
 * role, a role's extras between Help and Sign out, every link a registered
 * route, the menu keyboard model, and the one shared sign-out.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, matchPath } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdmitted } from '@/app/router/AppRoutes'
import { navAreaForRole, pageRoutes, type AppNavArea } from '@/app/router/routeManifest'
import { shellNavigationFor } from '@/components/shell/shellNavigation'
import { AccountMenu } from '@/components/shell/AccountMenu'
import { accountMenuFor, isRegisteredPage } from '@/components/shell/accountMenuTargets'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const i18n = vi.hoisted(() => ({ language: 'en', changeLanguage: vi.fn(async () => {}) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n }),
}))

const { signOut, updateLocale } = vi.hoisted(() => ({
  signOut: vi.fn(async () => {}),
  updateLocale: vi.fn(),
}))
vi.mock('@/hooks/auth/useSignOut', () => ({ useSignOut: () => ({ signOut, isSigningOut: false }) }))
vi.mock('@/hooks/auth/useUpdateLocalePreferenceMutation', () => ({
  useUpdateLocalePreferenceMutation: () => ({ mutate: updateLocale }),
}))

// Lets one test pretend billing is back (card 007 withdrew its routes).
const registry = vi.hoisted(() => ({ everything: false }))
vi.mock('@/components/shell/accountMenuTargets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/shell/accountMenuTargets')>()
  return {
    ...actual,
    accountMenuFor: (area: AppNavArea, isRegistered?: (path: string) => boolean) =>
      actual.accountMenuFor(area, registry.everything ? () => true : isRegistered),
  }
})

beforeEach(() => {
  signOut.mockClear()
  updateLocale.mockClear()
  i18n.changeLanguage.mockClear()
  registry.everything = false
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

function renderMenu(role: UserRole) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <button type="button">before</button>
        <AccountMenu />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return screen.getByRole('button', { name: 'accountMenu.open' })
}

async function openWithMouse(role: UserRole) {
  await userEvent.click(renderMenu(role))
  return screen.getByRole('menu', { name: 'accountMenu.open' })
}

const itemNames = (menu: HTMLElement) =>
  within(menu)
    .getAllByRole('menuitem')
    .map((item) => item.textContent?.replace(/language\.english$/, '').trim())

const FIXED = ['navigation.profile', 'language.label', 'actions.changePassword', 'accountMenu.help']

describe('the account menu', () => {
  it.each(['student', 'teacher', 'parent', 'admin', 'organization_admin'] as const)(
    'offers a %s the five fixed items, sign-out last',
    async (role) => {
      const menu = await openWithMouse(role)
      expect(itemNames(menu)).toEqual([...FIXED, 'actions.logOut'])
    },
  )

  it.each([
    ['student', '/me', '/me'],
    ['teacher', '/tutor/profile', '/settings/password'],
    ['parent', '/parent/account-operations', '/settings/password'],
  ] as const)('sends a %s to %s for the profile and %s for the password', async (role, profile, password) => {
    const menu = await openWithMouse(role)

    expect(within(menu).getByRole('menuitem', { name: 'navigation.profile' })).toHaveAttribute('href', profile)
    expect(within(menu).getByRole('menuitem', { name: 'actions.changePassword' })).toHaveAttribute('href', password)
    expect(within(menu).getByRole('menuitem', { name: 'accountMenu.help' })).toHaveAttribute('href', '/support')
  })

  it('shows an administrator the profile item without a page behind it, and cannot be chosen', async () => {
    const menu = await openWithMouse('admin')
    const profile = within(menu).getByRole('menuitem', { name: 'navigation.profile' })

    expect(profile).not.toHaveAttribute('href')
    expect(profile).toHaveAttribute('aria-disabled', 'true')
  })

  it('names the person and their role at the top', async () => {
    const menu = await openWithMouse('teacher')
    expect(within(menu).getByText('Lina Meier')).toBeInTheDocument()
    expect(within(menu).getByText('roles.teacher')).toBeInTheDocument()
  })

  it('leads only to pages the router registers', () => {
    for (const area of ['student', 'teacher', 'parent', 'admin', 'organization'] as const) {
      const targets = accountMenuFor(area)
      const paths = [targets.profile, targets.password, targets.help, ...targets.extras.map((extra) => extra.to)]
      expect(paths.filter((path): path is string => path !== null).filter((path) => !isRegisteredPage(path))).toEqual([])
    }
  })

  it('holds each item at 34 high, radius 7, in a 260 menu (Components: Account menu)', async () => {
    const menu = await openWithMouse('teacher')

    expect(menu).toHaveStyle({ width: '260px' })
    for (const item of within(menu).getAllByRole('menuitem')) {
      expect(item).toHaveStyle({ height: '34px', borderRadius: '7px' })
    }
  })

  it('keeps the parent billing item out while billing is withdrawn (card 007)', async () => {
    expect(accountMenuFor('parent').extras).toEqual([])
    const menu = await openWithMouse('parent')
    expect(within(menu).queryByRole('menuitem', { name: 'accountMenu.billing' })).toBeNull()
  })

  it('puts the parent billing item between Help and Sign out once its route is back (#46)', async () => {
    registry.everything = true
    const menu = await openWithMouse('parent')

    expect(itemNames(menu)).toEqual([...FIXED, 'accountMenu.billing', 'actions.logOut'])
    expect(within(menu).getByRole('menuitem', { name: 'accountMenu.billing' })).toHaveAttribute('href', '/billing')
  })

  it.each(['student', 'teacher', 'admin'] as const)('gives a %s no extra item even then', async (role) => {
    registry.everything = true
    const menu = await openWithMouse(role)
    expect(itemNames(menu)).toEqual([...FIXED, 'actions.logOut'])
  })

  it('signs out through the one shared sign-out', async () => {
    const menu = await openWithMouse('student')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'actions.logOut' }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('switches the language from its submenu and records the choice', async () => {
    const menu = await openWithMouse('student')
    await userEvent.click(within(menu).getByRole('menuitem', { name: /language\.label/ }))
    const german = await screen.findByRole('menuitemradio', { name: 'language.german' })
    expect(screen.getByRole('menuitemradio', { name: 'language.english' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(german)
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de')
    expect(updateLocale).toHaveBeenCalledWith('de')
  })
})

// A link that leads into another role's area would only end on the guard's
// refusal. Each target, the menu's and the bar's alike, must be a page whose
// manifest access admits the very role it is offered to.
const ALL_ROLES: UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

function routeFor(path: string) {
  return pageRoutes.find((route) => route.path !== '*' && matchPath({ path: route.path, end: true }, path))
}

describe('every link the shell offers a role admits that role', () => {
  it.each(ALL_ROLES)('holds for a %s', (role) => {
    const menu = accountMenuFor(navAreaForRole(role), () => true)
    const navigation = shellNavigationFor(role)
    const targets = [
      menu.profile,
      menu.password,
      menu.help,
      ...menu.extras.map((extra) => extra.to).filter(isRegisteredPage),
      ...(navigation.kind === 'none' ? [] : navigation.items.map((item) => item.path)),
    ].filter((path): path is string => path !== null)

    const refused = targets.filter((path) => {
      const route = routeFor(path)
      return !route || !isAdmitted(route.access, { role }, true)
    })
    expect(refused).toEqual([])
    expect(targets.length).toBeGreaterThanOrEqual(2)
  })
})

describe('the account menu from the keyboard', () => {
  it('opens on Enter, moves with the arrows, and closes on Escape back to the avatar', async () => {
    const user = userEvent.setup()
    const trigger = renderMenu('teacher')

    await user.tab()
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')
    const menu = await screen.findByRole('menu', { name: 'accountMenu.open' })
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'navigation.profile' })).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitem', { name: /language\.label/ })).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(within(menu).getByRole('menuitem', { name: 'navigation.profile' })).toHaveFocus()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('signs out from the keyboard', async () => {
    const user = userEvent.setup()
    const trigger = renderMenu('parent')
    trigger.focus()

    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    await user.keyboard('{End}{Enter}')
    expect(signOut).toHaveBeenCalledOnce()
  })
})
