/**
 * The bell's unread count (#373). It was counted among the items of one
 * `GET /notifications`, which holds the newest 50: with more than 50
 * notifications the older unread ones went uncounted, and the bell said fewer
 * or none. The count is now read on its own (`status=created`, `limit=100`),
 * reads "99+" above 99, and follows a read or an archive.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import i18n from '@/i18n'
import { httpClient } from '@/services/api/httpClient'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent, NotificationStatus } from '@/types/notification'

vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled', isLive: false }),
}))

// Event 1 is the oldest; a higher number is newer.
function event(n: number, status: NotificationStatus): NotificationEvent {
  return {
    eventId: `e-${n}`,
    recipientRole: 'student',
    eventType: 'system_notice',
    targetType: 'system',
    targetId: `t-${n}`,
    title: `Notice ${n}`,
    summary: `Summary ${n}`,
    status,
    createdAt: new Date(Date.UTC(2026, 9, 1) + n * 60_000).toISOString(),
    metadata: {},
  }
}

// The backend's list (`list_user_events`): newest first, `limit` 50 unless
// given, at most 100; no `status` leaves the archived out.
let store: NotificationEvent[] = []
const requests: string[] = []

function fakeBackend() {
  vi.spyOn(httpClient, 'get').mockImplementation(async (url: string, config?: { params?: unknown }) => {
    const { status, limit = 50 } = (config?.params ?? {}) as Record<string, unknown>
    requests.push(`GET ${url}${status ? ` status=${status} limit=${limit}` : ''}`)
    if (url !== '/notifications') throw new Error(`unexpected GET ${url}`)
    if (Number(limit) > 100) throw new Error('limit above 100')
    const items = store
      .filter((item) => (status === undefined ? item.status !== 'archived' : item.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Number(limit))
    return { data: { items, count: items.length } }
  })
  vi.spyOn(httpClient, 'post').mockImplementation(async (url: string) => {
    const match = /^\/notifications\/([^/]+)\/(read|archive)$/.exec(url)
    const item = match && store.find((candidate) => candidate.eventId === decodeURIComponent(match[1]))
    if (!match || !item) throw new Error(`unexpected POST ${url}`)
    item.status = match[2] === 'read' ? 'read' : 'archived'
    return { data: item }
  })
}

function renderBell(events: NotificationEvent[]) {
  store = events
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const bell = () => screen.getByRole('button', { name: /^Notifications/ })

async function openPanel() {
  await userEvent.click(bell())
  return screen.getByRole('dialog', { name: 'Notifications' })
}

// 60 notifications: the 10 oldest unread, the newest 50 read. The list
// (`GET /notifications`) holds only the newest 50, none of them unread.
function olderUnread() {
  return Array.from({ length: 60 }, (_, index) => event(index + 1, index < 10 ? 'created' : 'read'))
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  requests.length = 0
  fakeBackend()
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('the bell counts every unread notification, not only the newest 50 (#373)', () => {
  it('counts the unread ones older than the newest 50', async () => {
    renderBell(olderUnread())

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 10 unread'))
    const panel = await openPanel()
    expect(within(panel).getByText('10 unread')).toBeInTheDocument()
    // The list stays as it was: the newest 50, the unread ones not among them.
    expect(panel.querySelectorAll('[data-notification]')).toHaveLength(50)
    expect(within(panel).queryByText('New')).toBeNull()
    expect(requests).toContain('GET /notifications status=created limit=100')
  })

  it('reads "99+" above 99, in every language', async () => {
    renderBell(Array.from({ length: 150 }, (_, index) => event(index + 1, 'created')))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 99+ unread'))
    expect(within(await openPanel()).getByText('99+ unread')).toBeInTheDocument()

    const button = bell()
    for (const [language, label] of [
      ['de', 'Mitteilungen, 99+ ungelesen'],
      ['fr', 'Notifications, 99+ non lue(s)'],
      ['it', 'Notifiche, 99+ da leggere'],
    ] as const) {
      await i18n.changeLanguage(language)
      await waitFor(() => expect(button).toHaveAccessibleName(label))
    }
  })

  it('shows 99 as 99', async () => {
    renderBell(Array.from({ length: 99 }, (_, index) => event(index + 1, 'created')))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 99 unread'))
  })

  it('counts one fewer once an unread item is read', async () => {
    // The newest is unread and in the list, with the 10 older unread ones.
    renderBell([...olderUnread(), event(61, 'created')])
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 11 unread'))

    const panel = await openPanel()
    await userEvent.click(within(panel).getByRole('button', { name: /^Notice 61/ }))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 10 unread'))
    expect(within(panel).getByText('10 unread')).toBeInTheDocument()
  })

  it('counts one fewer once an unread item is archived', async () => {
    renderBell([...olderUnread(), event(61, 'created')])
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 11 unread'))

    const panel = await openPanel()
    const row = panel.querySelector<HTMLElement>('[data-notification="e-61"]')!
    await userEvent.click(within(row).getByRole('button', { name: 'Archive “Notice 61”' }))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 10 unread'))
  })
})
