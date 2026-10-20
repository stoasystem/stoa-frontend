/**
 * The bell's unread count, after #373 (#387).
 *
 * 1. A realtime event went into the list and not into the count, and polling
 *    stops while realtime is live: a new notification showed in the list and
 *    the bell's count stayed where it was. A new unread event now counts one
 *    more; a redelivery of one already listed does not.
 * 2. The count was a second `GET /notifications` on every poll and every list
 *    refresh, even when the list held every notification there is. A list
 *    short of a page (50) now gives the count itself; only a full page has it
 *    read on its own, which still reads "99+" above 99.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import i18n from '@/i18n'
import { httpClient } from '@/services/api/httpClient'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import {
  mergeRealtimeNotification,
  parseRealtimeNotificationMessage,
} from '@/services/notifications/realtimeNotifications'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent, NotificationListResponse, NotificationStatus } from '@/types/notification'

vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'live', isLive: true }),
}))

const student = { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser

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
const LIST = 'GET /notifications limit=50'
const COUNT = 'GET /notifications status=created limit=100'

function fakeBackend() {
  vi.spyOn(httpClient, 'get').mockImplementation(async (url: string, config?: { params?: Record<string, unknown> }) => {
    const params = config?.params ?? {}
    requests.push([`GET ${url}`, ...Object.entries(params).map(([key, value]) => `${key}=${value}`)].join(' '))
    if (url !== '/notifications') throw new Error(`unexpected GET ${url}`)
    const { status, limit = 50 } = params
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
  useAuthStore.setState({ user: student, accessToken: 'token', isAuthenticated: true })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}

const bell = () => screen.getByRole('button', { name: /^Notifications/ })

// A realtime event as the socket hands it over; it has not reached the fake
// backend's store, since polling is off while realtime is live.
function deliver(client: QueryClient, payload: Record<string, unknown>) {
  const parsed = parseRealtimeNotificationMessage(
    JSON.stringify({ eventType: 'system_notice', title: 'Live', summary: 'Live', ...payload }),
  )!
  act(() => mergeRealtimeNotification(client, parsed, student))
}

// 60 notifications: the 10 oldest unread, the newest 50 read. A full list.
function olderUnread() {
  return Array.from({ length: 60 }, (_, index) => event(index + 1, index < 10 ? 'created' : 'read'))
}

// 5 notifications, 2 of them unread. A list short of a page.
function fewUnread() {
  return [event(1, 'created'), event(2, 'read'), event(3, 'created'), event(4, 'read'), event(5, 'read')]
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

describe('a list short of a page gives the bell its count (#387 item 2)', () => {
  it('counts the unread ones in the list, with no second request', async () => {
    renderBell(fewUnread())

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 2 unread'))
    expect(requests).toEqual([LIST])
  })

  it('sends one request, not two, when the poll refreshes the list', async () => {
    const client = renderBell(fewUnread())
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 2 unread'))

    // What the fallback poll does every 30 seconds.
    await act(() => client.invalidateQueries({ queryKey: notificationQueryKeys.list() }))

    expect(requests).toEqual([LIST, LIST])
  })

  it('counts one fewer once an unread item is read, with no second request', async () => {
    renderBell(fewUnread())
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 2 unread'))

    await userEvent.click(bell())
    const panel = screen.getByRole('dialog', { name: 'Notifications' })
    await userEvent.click(within(panel).getByRole('button', { name: /^Notice 3/ }))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 1 unread'))
    expect(within(panel).getByText('1 unread')).toBeInTheDocument()
    expect(requests).not.toContain(COUNT)
  })

  it.each([
    [49, [LIST]],
    [50, [LIST, COUNT]],
  ])('reads the count on its own only for a full page: %i listed', async (length, expected) => {
    renderBell(Array.from({ length }, (_, index) => event(index + 1, index < 3 ? 'created' : 'read')))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 3 unread'))
    expect(requests).toEqual(expected)
  })

  it('still reads "99+" above 99 from a full page', async () => {
    renderBell(Array.from({ length: 150 }, (_, index) => event(index + 1, 'created')))

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 99+ unread'))
    expect(requests).toEqual([LIST, COUNT])
  })
})

describe('a realtime event moves the count (#387 item 1)', () => {
  it('counts a new event as one more unread, read on its own from a full list', async () => {
    const client = renderBell(olderUnread())
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 10 unread'))
    const before = requests.length

    deliver(client, { eventId: 'e-new' })

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 11 unread'))
    // Merged, not refetched: no request went out for it.
    expect(requests).toHaveLength(before)
  })

  it('counts a new event as one more unread, counted from a list short of a page', async () => {
    const client = renderBell(fewUnread())
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 2 unread'))

    deliver(client, { eventId: 'e-new' })

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 3 unread'))
    expect(requests).toEqual([LIST])
  })

  it('does not count a redelivery of an event already listed', async () => {
    const client = renderBell([...olderUnread(), event(61, 'created')])
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 11 unread'))

    // One the reader has read, and one still unread: neither is news. The new
    // one after them is, and the bell waits for it: the cache tells the bell
    // on a later tick, so a check right after the redeliveries proves nothing.
    deliver(client, { eventId: 'e-60', deliveryAttempt: 2 })
    deliver(client, { eventId: 'e-61', deliveryAttempt: 2 })
    deliver(client, { eventId: 'e-new' })

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 12 unread'))
  })

  it('does not count a redelivery in a list short of a page either', async () => {
    const client = renderBell(fewUnread())
    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 2 unread'))

    deliver(client, { eventId: 'e-new' })
    deliver(client, { eventId: 'e-new', deliveryAttempt: 2 })
    deliver(client, { eventId: 'e-2', deliveryAttempt: 2 })

    await waitFor(() => expect(bell()).toHaveAccessibleName('Notifications, 3 unread'))
  })
})

describe('the realtime +1 on a count read on its own (#387 item 1)', () => {
  const listed = (count: number) =>
    ({ items: Array.from({ length: count }, (_, index) => event(index + 1, 'read')), count }) as NotificationListResponse
  const live = parseRealtimeNotificationMessage(
    JSON.stringify({ eventId: 'e-new', eventType: 'system_notice', title: 'Live', summary: 'Live' }),
  )!

  it('keeps the count as old as it was, so it is refetched when due', () => {
    const client = new QueryClient()
    client.setQueryData(notificationQueryKeys.list(), listed(50))
    client.setQueryData(notificationQueryKeys.unreadCount(), 10, { updatedAt: 1_000 })

    mergeRealtimeNotification(client, live, student)

    expect(client.getQueryData(notificationQueryKeys.unreadCount())).toBe(11)
    expect(client.getQueryState(notificationQueryKeys.unreadCount())?.dataUpdatedAt).toBe(1_000)
  })

  it('leaves a count already due for a refetch to that refetch', async () => {
    const client = new QueryClient()
    client.setQueryData(notificationQueryKeys.list(), listed(50))
    client.setQueryData(notificationQueryKeys.unreadCount(), 10)
    await client.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount(), refetchType: 'none' })

    mergeRealtimeNotification(client, live, student)

    expect(client.getQueryData(notificationQueryKeys.unreadCount())).toBe(10)
    expect(client.getQueryState(notificationQueryKeys.unreadCount())?.isInvalidated).toBe(true)
  })

  it('makes no count where none was read yet', () => {
    const client = new QueryClient()
    client.setQueryData(notificationQueryKeys.list(), listed(50))

    mergeRealtimeNotification(client, live, student)

    expect(client.getQueryData(notificationQueryKeys.unreadCount())).toBeUndefined()
  })
})
