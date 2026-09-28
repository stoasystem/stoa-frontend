/**
 * The bell (#13 point 5, #46): every notification can be clicked; one with a
 * target opens it, and every target is a page that admits the role it is
 * shown to (the same check the account menu's links pass).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, matchPath, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isAdmitted } from '@/app/router/AppRoutes'
import { navAreaForRole, pageRoutes } from '@/app/router/routeManifest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { NOTIFICATION_TARGETS, notificationTargetPath } from '@/components/notifications/notificationTargets'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'
import type { UserRole } from '@/types/user'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))

const { items, markRead, archive } = vi.hoisted(() => ({
  items: { current: [] as unknown[] },
  markRead: vi.fn(),
  archive: vi.fn(),
}))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: items.current }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: markRead, isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: archive, isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))

function event(overrides: Partial<NotificationEvent>): NotificationEvent {
  return {
    eventId: 'e-1',
    recipientRole: 'student',
    eventType: 'teacher_reply',
    targetType: 'question',
    targetId: 'q-1',
    title: 'Teacher replied',
    summary: 'Your teacher added a reply to your question.',
    status: 'created',
    createdAt: '2026-09-28T10:00:00Z',
    metadata: {},
    ...overrides,
  }
}

let pathname = ''
function LocationProbe() {
  pathname = useLocation().pathname
  return null
}

function renderBell(role: UserRole, events: NotificationEvent[]) {
  items.current = events
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/somewhere']}>
        <NotificationCenter />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function openBell() {
  await userEvent.click(screen.getByRole('button', { name: /notifications\.openLabel/ }))
}

beforeEach(() => {
  markRead.mockClear()
  archive.mockClear()
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

describe('a notification in the bell', () => {
  it('opens its Ask conversation once the backend names one (stoa-backend#65)', async () => {
    renderBell('student', [event({ eventId: 'e-7', targetType: 'conversation', targetId: 'c-42' })])
    await openBell()

    await userEvent.click(screen.getByRole('button', { name: /Teacher replied/ }))

    expect(pathname).toBe('/ask/c-42')
    expect(markRead).toHaveBeenCalledWith('e-7')
    // The panel closes behind it.
    expect(screen.queryByRole('button', { name: /Teacher replied/ })).toBeNull()
  })

  it('opens Ask for a teacher notification on the old question path, until then', async () => {
    renderBell('student', [event({ targetType: 'question', targetId: 'q-9' })])
    await openBell()

    await userEvent.click(screen.getByRole('button', { name: /Teacher replied/ }))

    expect(pathname).toBe('/ask')
  })

  it('opens /assignments, which only the bell leads to (#13 point 3)', async () => {
    renderBell('student', [event({ targetType: 'assignment', targetId: 'a-1', title: 'New assignment' })])
    await openBell()

    await userEvent.click(screen.getByRole('button', { name: /New assignment/ }))

    expect(pathname).toBe('/assignments')
  })

  it('opens moderation for an administrator', async () => {
    renderBell('admin', [event({ targetType: 'moderation_case', targetId: 'm-1', title: 'Case updated' })])
    await openBell()

    await userEvent.click(screen.getByRole('button', { name: /Case updated/ }))

    expect(pathname).toBe('/admin/moderation')
  })

  it('is only marked read when there is no page for it, and stays open', async () => {
    renderBell('parent', [event({ eventId: 'e-3', targetType: 'subscription_request', title: 'Subscription updated' })])
    await openBell()

    const item = screen.getByRole('button', { name: /Subscription updated/ })
    await userEvent.click(item)

    expect(markRead).toHaveBeenCalledWith('e-3')
    expect(pathname).toBe('/somewhere')
    expect(item).toBeInTheDocument()
  })

  it('does not mark an item read twice', async () => {
    renderBell('student', [event({ status: 'read', targetType: 'conversation', targetId: 'c-1' })])
    await openBell()

    await userEvent.click(screen.getByRole('button', { name: /Teacher replied/ }))

    expect(markRead).not.toHaveBeenCalled()
    expect(pathname).toBe('/ask/c-1')
  })

  it('can still be archived without being opened', async () => {
    renderBell('student', [event({ eventId: 'e-5', targetType: 'conversation', targetId: 'c-1' })])
    await openBell()

    const row = document.querySelector('[data-notification="e-5"]') as HTMLElement
    await userEvent.click(within(row).getByRole('button', { name: 'notifications.archive' }))

    expect(archive).toHaveBeenCalledWith('e-5')
    expect(pathname).toBe('/somewhere')
  })
})

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

describe('every notification target', () => {
  it.each(ALL_ROLES)('is a page that admits a %s', (role) => {
    const targets = Object.keys(NOTIFICATION_TARGETS[navAreaForRole(role)]).map((targetType) =>
      notificationTargetPath({ targetType, targetId: 'id-1' }, role),
    )

    const refused = targets.filter((path) => {
      const route = path ? routeFor(path) : undefined
      return !route || !isAdmitted(route.access, { role }, true)
    })
    expect(refused).toEqual([])
  })

  it('never follows a target type onto an object prototype', () => {
    expect(notificationTargetPath({ targetType: 'constructor', targetId: 'x' }, 'student')).toBeNull()
    expect(notificationTargetPath({ targetType: 'toString', targetId: 'x' }, 'admin')).toBeNull()
  })

  it('keeps a conversation id that is not an id out of the address', () => {
    expect(notificationTargetPath({ targetType: 'conversation', targetId: '..' }, 'student')).toBe('/ask')
    expect(notificationTargetPath({ targetType: 'conversation', targetId: 'a/b' }, 'student')).toBe('/ask')
  })
})
