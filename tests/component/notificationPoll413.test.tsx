/**
 * The notification poll (#413).
 *
 * The realtime connection refetched the bell's list, a full page's count and
 * an admin's operational list on its own 30 s timer, whether the tab was shown
 * or not. Production ships realtime off, so every hidden tab polled for as
 * long as it stayed open, and every tab more polled once more. The queries
 * now poll themselves: every 30 s while realtime is not live, only in a tab
 * that is shown, and not at all while the socket is live.
 *
 * A tab shown again reads at once what is older than a poll (#452), so the
 * bell is not left up to 30 s behind; while the socket is live it reads
 * nothing on that account either.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminOperationalNotificationsCard } from '@/components/admin/AdminOperationalNotificationsCard'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import i18n from '@/i18n'
import { httpClient } from '@/services/api/httpClient'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { NotificationEvent } from '@/types/notification'

const env = vi.hoisted(() => ({ realtime: false }))

vi.mock('@/lib/env', () => ({
  appEnv: 'production',
  apiMode: 'production',
  apiBaseUrl: 'https://api.test',
  enableMSW: false,
  isDevelopment: false,
  isStaging: false,
  isProduction: true,
  isProductionFacing: true,
  enableDemoShortcuts: false,
  enableAnalytics: false,
  enableFeedback: true,
  enablePayment: false,
  enableMockCheckout: false,
  enablePublicRegister: true,
  enableTeacherHelp: true,
  enableParentReport: true,
  enableReferral: false,
  enableSupportTickets: true,
  enableDemoApi: false,
  // Off, as production ships it, unless a test turns it on.
  get enableRealtimeNotifications() {
    return env.realtime
  },
  websocketBaseUrl: 'wss://rt.test',
  allowDemoFallback: false,
  showDemoAccounts: false,
  showDemoBadges: false,
  showInternalDebug: false,
  showDemoSurfaces: false,
  showCheckoutPreview: false,
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
  constructor(public url: string) {
    FakeSocket.all.push(this)
  }
  send() {}
  close() {
    this.readyState = FakeSocket.CLOSED
    this.onclose?.()
  }
  open() {
    this.readyState = FakeSocket.OPEN
    this.onopen?.()
  }
}

const admin = { id: 'u-1', name: 'Ada Admin', email: 'ada@example.com', role: 'admin' } as CurrentUser

function event(n: number): NotificationEvent {
  return {
    eventId: `e-${n}`,
    recipientRole: 'admin',
    eventType: 'system_notice',
    targetType: 'system',
    targetId: `t-${n}`,
    title: `Notice ${n}`,
    summary: `Summary ${n}`,
    status: 'read',
    createdAt: new Date(Date.UTC(2026, 9, 1) + n * 60_000).toISOString(),
    metadata: {},
  }
}

const LIST = 'GET /notifications limit=50'
const COUNT = 'GET /notifications status=created limit=100'
const ADMIN = 'GET /admin/notifications'
const requests: string[] = []
let listed = 0

function fakeBackend() {
  vi.spyOn(httpClient, 'get').mockImplementation(async (url: string, config?: { params?: unknown }) => {
    const params = (config?.params ?? {}) as Record<string, unknown>
    requests.push([`GET ${url}`, ...Object.entries(params).map(([key, value]) => `${key}=${value}`)].join(' '))
    const items = Array.from({ length: listed }, (_, index) => event(index + 1))
    return { data: { items, count: items.length } }
  })
}

const sent = () => ({
  list: requests.filter((request) => request === LIST).length,
  count: requests.filter((request) => request === COUNT).length,
  admin: requests.filter((request) => request === ADMIN).length,
})

// The bell in the top bar and the admin dashboard's operational card: every
// notification query there is, on one page. The client takes the app's
// `refetchOnWindowFocus: false`: whatever a tab shown again reads, the
// notification queries read of their own.
function renderAdminPage(length: number) {
  listed = length
  useAuthStore.setState({ user: admin, accessToken: 'token', isAuthenticated: true })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <NotificationCenter />
        <AdminOperationalNotificationsCard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
// Long enough for the first requests, and the count a full page asks for
// after them, to come back; far short of a poll.
const settle = () => wait(50)

let visibility: DocumentVisibilityState = 'visible'
function show(state: DocumentVisibilityState) {
  visibility = state
  act(() => {
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
  })
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.useFakeTimers()
  vi.stubGlobal('WebSocket', FakeSocket)
  FakeSocket.all = []
  env.realtime = false
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  requests.length = 0
  fakeBackend()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete (document as { visibilityState?: DocumentVisibilityState }).visibilityState
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('with realtime off, as in production', () => {
  it('a tab that is shown polls every 30 s', async () => {
    renderAdminPage(5)
    await settle()
    expect(sent()).toEqual({ list: 1, count: 0, admin: 1 })

    await wait(30_000)
    expect(sent()).toEqual({ list: 2, count: 0, admin: 2 })

    await wait(30_000)
    // A list short of a page still gives the count itself (#387): the poll
    // asks for no count of its own.
    expect(sent()).toEqual({ list: 3, count: 0, admin: 3 })
  })

  it('a full page polls its count on its own with the list', async () => {
    renderAdminPage(50)
    await settle()
    expect(sent()).toEqual({ list: 1, count: 1, admin: 1 })

    await wait(30_000)
    expect(sent()).toEqual({ list: 2, count: 2, admin: 2 })
  })

  it('a hidden tab sends no poll, and one shown again reads at once, then polls again', async () => {
    renderAdminPage(50)
    await settle()
    expect(sent()).toEqual({ list: 1, count: 1, admin: 1 })

    show('hidden')
    await wait(120_000)
    expect(sent()).toEqual({ list: 1, count: 1, admin: 1 })

    // Not at the next poll, up to 30 s on (#452).
    show('visible')
    await settle()
    expect(sent()).toEqual({ list: 2, count: 2, admin: 2 })

    await wait(30_000)
    expect(sent()).toEqual({ list: 3, count: 3, admin: 3 })
  })

  it('a tab shown again before a poll was due reads nothing more', async () => {
    renderAdminPage(50)
    await settle()

    show('hidden')
    await wait(10_000)
    show('visible')
    await settle()
    expect(sent()).toEqual({ list: 1, count: 1, admin: 1 })
  })
})

describe('with realtime on', () => {
  beforeEach(() => {
    env.realtime = true
  })

  it('a live connection stops the poll, and a dropped one starts it again', async () => {
    renderAdminPage(5)
    await settle()
    expect(sent()).toEqual({ list: 1, count: 0, admin: 1 })

    // Live: the socket merges every event in, and nothing polls.
    act(() => FakeSocket.all[0].open())
    await wait(90_000)
    expect(sent()).toEqual({ list: 1, count: 0, admin: 1 })

    // Dropped: the lists are refreshed once at once, then polled while the
    // reconnect does not come up.
    act(() => FakeSocket.all[0].close())
    await settle()
    expect(sent()).toEqual({ list: 2, count: 0, admin: 2 })
    await wait(30_000)
    expect(FakeSocket.all.length).toBeGreaterThan(1)
    expect(sent()).toEqual({ list: 3, count: 0, admin: 3 })
  })

  it('a tab shown again while live reads nothing: the socket brought it all', async () => {
    renderAdminPage(5)
    await settle()
    act(() => FakeSocket.all[0].open())

    show('hidden')
    await wait(120_000)
    show('visible')
    await settle()
    expect(sent()).toEqual({ list: 1, count: 0, admin: 1 })
  })

  it('a connection still opening polls, as one that is not there', async () => {
    renderAdminPage(5)
    await settle()
    expect(FakeSocket.all[0].readyState).toBe(FakeSocket.CONNECTING)

    await wait(30_000)
    expect(sent()).toEqual({ list: 2, count: 0, admin: 2 })
  })
})
