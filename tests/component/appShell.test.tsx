/**
 * The app shell of the redesign (#18; #13 points 5 and 6): one top bar with
 * the logo, the bell and the avatar, at the canvas sizes; no sidebar and no
 * bottom tab bar; a segmented control for a teacher or parent, a source list
 * for an administrator, nothing beside the logo for a student.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppLayout } from '@/layouts/AppLayout'
import { activeNavIndex, shellNavigationFor } from '@/components/shell/shellNavigation'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en', changeLanguage: vi.fn() },
  }),
}))
// The bell's own data is not what this is about.
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

const originalMatchMedia = window.matchMedia
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

function renderShell(role: UserRole, path: string, width: number, surface?: 'sky') {
  emulateWidth(width)
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <AppLayout surface={surface}>
          <p>page</p>
        </AppLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const bar = () => document.querySelector('[data-top-bar]') as HTMLElement
const barRow = () => document.querySelector('[data-top-bar-row]') as HTMLElement

describe('the top bar', () => {
  it('is 56 high on a desktop: logo 30, bell 36 with a 22 glyph, avatar 30, side padding 20, gap 6', () => {
    renderShell('student', '/', 1280)

    expect(barRow()).toHaveStyle({ height: '56px', paddingLeft: '20px', paddingRight: '20px' })
    expect(within(bar()).getByRole('img', { name: 'STOA' })).toHaveStyle({ height: '30px' })
    const bell = within(bar()).getByRole('button', { name: 'notifications.openLabel' })
    expect(bell).toHaveStyle({ width: '36px', height: '36px' })
    expect(bell.querySelector('svg')).toHaveAttribute('width', '22')
    const account = within(bar()).getByRole('button', { name: 'accountMenu.open' })
    expect(account.querySelector('[data-avatar]')).toHaveStyle({ width: '30px', height: '30px' })
    expect(account.parentElement).toHaveStyle({ gap: '6px' })
  })

  it('is 44 high on a phone, 16 / 8 from the edges: logo 26, avatar 28', () => {
    renderShell('student', '/', 375)

    expect(barRow()).toHaveStyle({ height: '44px', paddingLeft: '16px', paddingRight: '8px' })
    expect(within(bar()).getByRole('img', { name: 'STOA' })).toHaveStyle({ height: '26px' })
    const account = within(bar()).getByRole('button', { name: 'accountMenu.open' })
    expect(account.querySelector('[data-avatar]')).toHaveStyle({ width: '28px' })
  })

  it.each([375, 1280])('holds only the logo, the bell and the avatar for a student at %ipx', (width) => {
    renderShell('student', '/', width)

    const controls = [...within(bar()).getAllByRole('link'), ...within(bar()).getAllByRole('button')]
    expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
      'navigation.logoHome',
      'notifications.openLabel',
      'accountMenu.open',
    ])
    expect(screen.queryAllByRole('navigation')).toEqual([])
  })

  it('makes the logo the way home', () => {
    renderShell('teacher', '/tutor/availability', 1280)
    expect(within(bar()).getByRole('link', { name: 'navigation.logoHome' })).toHaveAttribute('href', '/tutor')
  })
})

describe('no sidebar and no bottom tab bar', () => {
  it.each(['student', 'teacher', 'parent'] as const)('keeps a %s to the bar alone, at every width', (role) => {
    for (const width of [375, 1280]) {
      const { unmount } = renderShell(role, '/', width)
      expect(document.querySelector('aside')).toBeNull()
      expect(screen.queryByRole('navigation', { name: 'navigation.mobilePrimary' })).toBeNull()
      expect(screen.queryByRole('navigation', { name: 'navigation.administration' })).toBeNull()
      unmount()
    }
  })
})

describe('what sits beside the logo', () => {
  it('gives a teacher Requests | Availability, with the profile left to the account menu', () => {
    renderShell('teacher', '/tutor/availability', 1280)

    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/tutor', '/tutor/availability'])
    expect(within(nav).getByRole('link', { name: 'navigation.availability' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'navigation.requests' })).not.toHaveAttribute('aria-current')
  })

  it('gives a parent Overview | Reports', () => {
    renderShell('parent', '/parent', 1280)

    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    expect(within(nav).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/parent',
      '/parent/reports',
    ])
  })

  it('puts the segmented control under the bar on a phone, still inside the header', () => {
    renderShell('teacher', '/tutor', 375)

    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    expect(barRow().contains(nav)).toBe(false)
    expect(nav).toHaveStyle({ width: '100%' })
  })

  it.each([
    [1280, 'column'],
    [375, 'strip'],
  ])('gives an administrator the source list at %ipx, as a %s', (width, shape) => {
    renderShell('admin', '/admin/users', width)

    const list = screen.getByRole('navigation', { name: 'navigation.administration' })
    expect(list).toHaveAttribute('data-source-list', shape)
    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/admin',
      '/admin/users',
      '/admin/moderation',
      '/admin/curriculum',
      '/admin/teacher-applications',
    ])
    expect(within(list).getByRole('link', { name: 'Accounts' })).toHaveAttribute('aria-current', 'page')
    expect(within(list).getByRole('link', { name: 'navigation.overview' })).not.toHaveAttribute('aria-current')
    expect(within(list).getByRole('link', { name: 'Accounts' })).toHaveStyle({ height: '34px', borderRadius: '8px' })
  })

  it('lights the most specific entry for the open page', () => {
    const item = (path: string) =>
      ({ path, label: path, role: 'admin', priority: 'primary', status: 'core', icon: 'dashboard' }) as const
    const items = [item('/admin'), item('/admin/users')]
    expect(activeNavIndex(items, '/admin')).toBe(0)
    expect(activeNavIndex(items, '/admin/users/42')).toBe(1)
    expect(activeNavIndex(items, '/adminx')).toBe(-1)
  })

  it.each(['student', 'organization_admin', 'school_teacher', 'school_viewer'] as const)(
    'offers a %s nothing beside the logo',
    (role) => {
      expect(shellNavigationFor(role)).toEqual({ kind: 'none' })
    },
  )
})

describe('the sky', () => {
  it('scopes the dark tokens to the page area and leaves the bar light', () => {
    renderShell('student', '/', 1280, 'sky')

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('data-surface', 'sky')
    expect(bar().closest('[data-surface="sky"]')).toBeNull()
  })

  it('is not the default', () => {
    renderShell('student', '/', 1280)
    expect(document.querySelector('[data-surface="sky"]')).toBeNull()
  })
})
