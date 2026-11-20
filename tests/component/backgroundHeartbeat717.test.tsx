/**
 * The background heartbeat (#717).
 *
 * The backend counts a teacher as online only if available and seen in the
 * last 5 minutes (stoa-backend#530); every poll stops in a hidden tab (#413).
 * So while a teacher's or an admin's tab is hidden, it reads one notification
 * every 60 s. A shown tab sends none of its own, students and parents never
 * do, and signing out or closing the tab ends it.
 */
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { HEARTBEAT_MS, useBackgroundHeartbeat } from '@/hooks/notifications/useBackgroundHeartbeat'
import i18n from '@/i18n'
import { httpClient } from '@/services/api/httpClient'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const BEAT = 'GET /notifications limit=1'
const requests: string[] = []
let fail = false

const beats = () => requests.filter((request) => request === BEAT).length
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

let visibility: DocumentVisibilityState = 'visible'
function show(state: DocumentVisibilityState) {
  visibility = state
  act(() => {
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
  })
}

function signIn(role: UserRole) {
  act(() => {
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
  })
}

function signOut() {
  act(() => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
  requests.length = 0
  fail = false
  vi.spyOn(httpClient, 'get').mockImplementation(async (url: string, config?: { params?: unknown }) => {
    const params = (config?.params ?? {}) as Record<string, unknown>
    requests.push([`GET ${url}`, ...Object.entries(params).map(([key, value]) => `${key}=${value}`)].join(' '))
    if (fail) throw new Error('network down')
    return { data: { items: [], count: 0 } }
  })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (document as { visibilityState?: DocumentVisibilityState }).visibilityState
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('a hidden tab', () => {
  it.each(['teacher', 'admin'] as const)("of a %s beats every 60 s, well inside the backend's 5 minutes", async (role) => {
    signIn(role)
    renderHook(() => useBackgroundHeartbeat())
    show('hidden')

    await wait(HEARTBEAT_MS - 1)
    expect(beats()).toBe(0)
    await wait(1)
    expect(beats()).toBe(1)
    await wait(9 * HEARTBEAT_MS)
    expect(beats()).toBe(10)
    // The beat is the one-item read, nothing else.
    expect(requests).toEqual(Array(10).fill(BEAT))
  })

  it.each(['student', 'parent', 'organization_admin', 'school_teacher'] as const)('of a %s sends nothing', async (role) => {
    signIn(role)
    renderHook(() => useBackgroundHeartbeat())
    show('hidden')

    await wait(10 * HEARTBEAT_MS)
    expect(requests).toEqual([])
  })

  it('signed out sends nothing', async () => {
    renderHook(() => useBackgroundHeartbeat())
    show('hidden')

    await wait(10 * HEARTBEAT_MS)
    expect(requests).toEqual([])
  })

  it('keeps beating after a beat failed', async () => {
    signIn('teacher')
    renderHook(() => useBackgroundHeartbeat())
    show('hidden')
    fail = true

    await wait(2 * HEARTBEAT_MS)
    fail = false
    await wait(HEARTBEAT_MS)
    expect(beats()).toBe(3)
  })

  it('that loads hidden beats from the start', async () => {
    visibility = 'hidden'
    signIn('teacher')
    renderHook(() => useBackgroundHeartbeat())

    await wait(HEARTBEAT_MS)
    expect(beats()).toBe(1)
  })
})

describe('the heartbeat stops', () => {
  it('in a tab that is shown: its own polls are the heartbeat there', async () => {
    signIn('teacher')
    renderHook(() => useBackgroundHeartbeat())

    await wait(10 * HEARTBEAT_MS)
    expect(requests).toEqual([])

    show('hidden')
    await wait(2 * HEARTBEAT_MS)
    expect(beats()).toBe(2)

    show('visible')
    await wait(10 * HEARTBEAT_MS)
    expect(beats()).toBe(2)
  })

  it('on sign-out, and starts again on the next teacher sign-in', async () => {
    signIn('teacher')
    renderHook(() => useBackgroundHeartbeat())
    show('hidden')
    await wait(HEARTBEAT_MS)
    expect(beats()).toBe(1)

    signOut()
    await wait(10 * HEARTBEAT_MS)
    expect(beats()).toBe(1)

    // Another account in the same tab: a student's sends nothing.
    signIn('student')
    await wait(10 * HEARTBEAT_MS)
    expect(beats()).toBe(1)

    signIn('teacher')
    await wait(HEARTBEAT_MS)
    expect(beats()).toBe(2)
  })

  it('when the tab closes', async () => {
    signIn('teacher')
    const { unmount } = renderHook(() => useBackgroundHeartbeat())
    show('hidden')
    await wait(HEARTBEAT_MS)

    unmount()
    await wait(10 * HEARTBEAT_MS)
    expect(beats()).toBe(1)
  })
})

describe('the app', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it("beats for a teacher's hidden tab from its providers, on every page", async () => {
    signIn('teacher')
    render(
      <AppProviders>
        <p>page</p>
      </AppProviders>,
    )
    show('hidden')

    await wait(HEARTBEAT_MS)
    expect(beats()).toBe(1)
  })
})
