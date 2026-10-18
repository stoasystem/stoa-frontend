/**
 * Realtime notifications (#273, items 1 and 2).
 *
 * 1. One connection at a time: an `online` while a reconnect is pending used
 *    to open a second socket, the timer then opened a third, two heartbeats
 *    ran, and one socket stayed open after unmount.
 * 2. A redelivered event used to put an item the reader had read back to
 *    unread, because every realtime event arrived as `created`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRealtimeNotifications } from '@/hooks/notifications/useRealtimeNotifications'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import {
  mergeRealtimeNotification,
  parseRealtimeNotificationMessage,
} from '@/services/notifications/realtimeNotifications'
import { useAuthStore } from '@/store/authStore'
import type { NotificationEvent, NotificationListResponse } from '@/types/notification'

vi.mock('@/lib/env', () => ({
  apiBaseUrl: 'https://api.test',
  appEnv: 'staging',
  isProduction: false,
  enableAnalytics: false,
  enableRealtimeNotifications: true,
  websocketBaseUrl: 'wss://rt.test',
  showDemoSurfaces: false,
}))

class FakeSocket {
  static all: FakeSocket[] = []
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 3
  readyState = FakeSocket.CONNECTING
  onopen?: () => void
  onclose?: () => void
  onerror?: () => void
  onmessage?: (message: { data: unknown }) => void
  sent: string[] = []
  constructor(public url: string) {
    FakeSocket.all.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {
    this.readyState = FakeSocket.CLOSED
    this.onclose?.()
  }
  open() {
    this.readyState = FakeSocket.OPEN
    this.onopen?.()
  }
  drop() {
    this.readyState = FakeSocket.CLOSED
    this.onclose?.()
  }
}

const notClosed = () => FakeSocket.all.filter((socket) => socket.readyState !== FakeSocket.CLOSED)
const heartbeats = () =>
  FakeSocket.all.flatMap((socket) => socket.sent).filter((data) => data.includes('heartbeat')).length

describe('the realtime connection (#273 item 1)', () => {
  beforeEach(() => {
    FakeSocket.all = []
    vi.useFakeTimers()
    vi.stubGlobal('WebSocket', FakeSocket)
    useAuthStore.setState({
      user: { id: 'u-1', name: 'A', email: 'a@example.com', role: 'student' } as never,
      accessToken: 'token',
      isAuthenticated: true,
    })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function renderConnection() {
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return renderHook(() => useRealtimeNotifications(), { wrapper })
  }

  it('an online event during a pending reconnect replaces it instead of adding a second socket', () => {
    const hook = renderConnection()
    act(() => FakeSocket.all[0].open())
    // The connection drops: a reconnect is scheduled for 1 s.
    act(() => FakeSocket.all[0].drop())
    // The network flaps before the timer fires.
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(FakeSocket.all).toHaveLength(2)
    act(() => {
      vi.advanceTimersByTime(1_500)
    })
    expect(FakeSocket.all).toHaveLength(2)
    expect(notClosed()).toHaveLength(1)

    act(() => FakeSocket.all[1].open())
    const before = heartbeats()
    act(() => {
      vi.advanceTimersByTime(25_000)
    })
    expect(heartbeats() - before).toBe(1)

    hook.unmount()
    expect(notClosed()).toHaveLength(0)
  })

  it('a reconnect closes a socket that is still connecting', () => {
    const hook = renderConnection()
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(FakeSocket.all).toHaveLength(2)
    expect(notClosed()).toEqual([FakeSocket.all[1]])
    hook.unmount()
    expect(notClosed()).toHaveLength(0)
  })

  it('an online event while live keeps the one socket', () => {
    const hook = renderConnection()
    act(() => FakeSocket.all[0].open())
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(FakeSocket.all).toHaveLength(1)
    hook.unmount()
  })

  it('signing out closes the socket and schedules nothing', () => {
    renderConnection()
    act(() => FakeSocket.all[0].open())
    act(() => {
      useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    })
    expect(notClosed()).toHaveLength(0)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(FakeSocket.all).toHaveLength(1)
  })
})

describe('a redelivered event (#273 item 2)', () => {
  const read: NotificationEvent = {
    eventId: 'e-1',
    recipientRole: 'student',
    eventType: 'teacher_reply',
    targetType: 'question',
    targetId: 'q-1',
    title: 't',
    summary: 's',
    status: 'read',
    createdAt: '2026-10-18T07:00:00Z',
    readAt: '2026-10-18T08:00:00Z',
    metadata: {},
  }
  const other: NotificationEvent = { ...read, eventId: 'e-0', status: 'created', readAt: null }

  function deliver(client: QueryClient, payload: Record<string, unknown>) {
    const event = parseRealtimeNotificationMessage(
      JSON.stringify({ eventType: 'teacher_reply', title: 't', summary: 's', ...payload }),
    )!
    mergeRealtimeNotification(client, event, { id: 'u-1', role: 'student' } as never)
    return client.getQueryData<NotificationListResponse>(notificationQueryKeys.list())!
  }

  it('keeps an item the reader already read as read, in its place', () => {
    const client = new QueryClient()
    client.setQueryData<NotificationListResponse>(notificationQueryKeys.list(), { items: [other, read], count: 2 })
    const list = deliver(client, { eventId: 'e-1', deliveryAttempt: 2 })
    expect(list.count).toBe(2)
    expect(list.items.map((item) => item.eventId)).toEqual(['e-0', 'e-1'])
    expect(list.items[1].status).toBe('read')
    expect(list.items[1].readAt).toBe('2026-10-18T08:00:00Z')
  })

  it('still puts a new event on top as unread', () => {
    const client = new QueryClient()
    client.setQueryData<NotificationListResponse>(notificationQueryKeys.list(), { items: [read], count: 1 })
    const list = deliver(client, { eventId: 'e-2' })
    expect(list.items.map((item) => [item.eventId, item.status])).toEqual([
      ['e-2', 'created'],
      ['e-1', 'read'],
    ])
  })
})
