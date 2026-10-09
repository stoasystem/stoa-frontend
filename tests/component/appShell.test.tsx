/**
 * The app shell of the redesign (#18; #13 points 5 and 6): one top bar with
 * the logo, the bell and the avatar, at the canvas sizes; no sidebar and no
 * bottom tab bar; a segmented control for a teacher or parent, a source list
 * for an administrator, nothing beside the logo for a student.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

    // The avatar's 44 target reaches 8 into the edge padding, so the drawn
    // 28 avatar still sits 8 from the edge.
    expect(barRow()).toHaveStyle({ height: '44px', paddingLeft: '16px', paddingRight: '0px' })
    expect(within(bar()).getByRole('img', { name: 'STOA' })).toHaveStyle({ height: '26px' })
    const account = within(bar()).getByRole('button', { name: 'accountMenu.open' })
    expect(account.querySelector('[data-avatar]')).toHaveStyle({ width: '28px' })
    expect(account).toHaveStyle({ width: '44px' })
    const bell = within(bar()).getByRole('button', { name: 'notifications.openLabel' })
    expect(bell.querySelector('[data-icon-button-face]')).toHaveStyle({ width: '36px', height: '36px' })
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
    renderShell('teacher', '/teacher/availability', 1280)
    expect(within(bar()).getByRole('link', { name: 'navigation.logoHome' })).toHaveAttribute('href', '/teacher')
  })
})

// Sizes: "Touch targets never fall under 44 on phone; the visible control may
// be smaller." jsdom lays nothing out, so each target's own box is read off
// its style; they sit side by side with no gap, so none overlaps another.
const px = (value: string) => Number.parseFloat(value)
function expectTouchTarget(element: HTMLElement, what: string) {
  // A flex link without a width is as wide as its label: only the logo is not.
  const width = element.style.width
    ? px(element.style.width)
    : element.style.minWidth
      ? px(element.style.minWidth)
      : element.hasAttribute('data-logo-link')
        ? 0
        : Infinity
  const height = px(element.style.height)
  expect(height, `${what} is ${height} high`).toBeGreaterThanOrEqual(44)
  expect(width, `${what} is ${width} wide`).toBeGreaterThanOrEqual(44)
}

describe('touch targets on a phone', () => {
  it.each(['student', 'teacher', 'parent', 'admin'] as const)('are at least 44 x 44 for every bar control of a %s', (role) => {
    const home = { student: '/', teacher: '/teacher', parent: '/parent', admin: '/admin/users' }[role]
    renderShell(role, home, 375)

    expectTouchTarget(within(bar()).getByRole('link', { name: 'navigation.logoHome' }), 'the logo')
    expectTouchTarget(within(bar()).getByRole('button', { name: 'notifications.openLabel' }), 'the bell')
    expectTouchTarget(within(bar()).getByRole('button', { name: 'accountMenu.open' }), 'the avatar')
    expect(barRow().querySelector('[data-top-bar-row] > div:last-child')).toHaveStyle({ gap: '0px' })

    const segmented = within(bar()).queryByRole('navigation', { name: 'navigation.primary' })
    for (const link of segmented ? within(segmented).getAllByRole('link') : []) {
      expectTouchTarget(link, `the ${link.textContent} segment`)
    }
    const strip = screen.queryByRole('navigation', { name: 'navigation.administration' })
    for (const link of strip ? within(strip).getAllByRole('link') : []) {
      expectTouchTarget(link, `the ${link.textContent} source-list link`)
    }
    if (role === 'teacher' || role === 'parent') expect(segmented).not.toBeNull()
    if (role === 'admin') expect(strip).not.toBeNull()
  })

  it('keeps the bell and avatar targets square, so a tap in a corner of the 44 box still lands', () => {
    renderShell('student', '/', 375)
    for (const name of ['notifications.openLabel', 'accountMenu.open']) {
      const target = within(bar()).getByRole('button', { name })
      // Chrome hit-tests the rounded shape: a rounded 44 box is a 44 circle.
      expect(target.className, name).not.toMatch(/\brounded/)
    }
  })

  it('makes every account menu item a 44 target', async () => {
    renderShell('parent', '/parent', 375)
    await userEvent.click(within(bar()).getByRole('button', { name: 'accountMenu.open' }))
    const menu = screen.getByRole('menu')
    for (const item of within(menu).getAllByRole('menuitem')) {
      expect(item).toHaveStyle({ height: '44px' })
    }
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
    renderShell('teacher', '/teacher/availability', 1280)

    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/teacher', '/teacher/availability'])
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
    renderShell('teacher', '/teacher', 375)

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
    if (shape === 'column') {
      // Admin board: 240 wide, sticky under the 56 bar and its separator.
      expect(list).toHaveStyle({ width: '240px' })
      expect(list.style.top).toBe('calc(57px + env(safe-area-inset-top))')
    }
    // #13 point 6: six items, Subscriptions and billing withheld while frozen (card 007).
    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/admin/users',
      '/admin/teacher-applications',
      '/admin/curriculum',
      '/admin/moderation',
      '/admin',
    ])
    expect(within(list).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'navigation.admin.users',
      'navigation.admin.teacherApplications',
      'navigation.admin.curriculum',
      'navigation.admin.moderation',
      'navigation.admin.system',
    ])
    expect(within(list).getByRole('link', { name: 'navigation.admin.users' })).toHaveAttribute('aria-current', 'page')
    expect(within(list).getByRole('link', { name: 'navigation.admin.system' })).not.toHaveAttribute('aria-current')
    const accounts = within(list).getByRole('link', { name: 'navigation.admin.users' })
    expect(accounts.querySelector('[data-source-item]')).toHaveStyle({ height: '34px', borderRadius: '8px' })
    expect(accounts).toHaveStyle({ height: shape === 'column' ? '34px' : '44px' })
  })

  it.each([
    ['/admin/account-operations', 'navigation.admin.users'],
    ['/admin', 'navigation.admin.system'],
    ['/admin/system', 'navigation.admin.system'],
    ['/admin/learning-operations', 'navigation.admin.system'],
    ['/admin/learning-automation', 'navigation.admin.system'],
    ['/admin/moderation', 'navigation.admin.moderation'],
  ])('lights the section a page belongs to (%s lights %s)', (path, label) => {
    renderShell('admin', path, 1280)
    const list = screen.getByRole('navigation', { name: 'navigation.administration' })
    const current = within(list)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(current.map((link) => link.textContent)).toEqual([label])
  })

  it.each([
    ['/teacher/learning-automation', 'navigation.requests'],
    ['/teacher/requests/r-1', 'navigation.requests'],
  ])('keeps a teacher on Requests inside it (%s)', (path, label) => {
    renderShell('teacher', path, 1280)
    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    ['teacher', '/teacher/profile'],
    ['parent', '/parent/account-operations'],
  ] as const)('lights no segment on a page the avatar menu opens (%s, %s)', (role, path) => {
    renderShell(role, path, 1280)
    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    expect(within(nav).getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toEqual([])
  })

  it('keeps a parent on Overview in a child\'s detail', () => {
    renderShell('parent', '/parent/children/c-1', 1280)
    const nav = within(bar()).getByRole('navigation', { name: 'navigation.primary' })
    expect(within(nav).getByRole('link', { name: 'navigation.overview' })).toHaveAttribute('aria-current', 'page')
  })

  it('lights the most specific entry for the open page', () => {
    const item = (path: string) =>
      ({ path, label: path, role: 'admin', priority: 'primary', status: 'core', icon: 'dashboard' }) as const
    const items = [item('/admin'), item('/admin/users')]
    expect(activeNavIndex(items, '/admin')).toBe(0)
    expect(activeNavIndex(items, '/admin/users/42')).toBe(1)
    expect(activeNavIndex(items, '/adminx')).toBe(-1)
  })

  it('never offers in the bar what the avatar menu already holds, billing included once it is back', () => {
    for (const role of ['student', 'parent', 'teacher', 'admin'] as const) {
      const navigation = shellNavigationFor(role)
      const paths = navigation.kind === 'none' ? [] : navigation.items.map((item) => item.path)
      expect(paths.filter((path) => ['/billing', '/support', '/me', '/teacher/profile', '/settings/password', '/parent/account-operations'].includes(path))).toEqual([])
    }
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
