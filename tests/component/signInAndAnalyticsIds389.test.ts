/**
 * A sign-in's id and a tab's analytics session on a browser without
 * `crypto.randomUUID` (iOS Safari 15.0–15.3, a page outside https) (#389).
 *
 * The sign-in id fell back to `Date.now` and `Math.random`, and the analytics
 * session to nothing at all: every event such a browser sent had no session.
 * Both now take the same v4 UUID the hint key does, built from
 * `crypto.getRandomValues`.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeTab, migrateSavedAccounts, readBrowserSignIn, signInTab, TAB_TOKEN_KEY } from '@/lib/tabAccount'
import { rotateAnalyticsSession, trackEvent } from '@/services/analytics/analyticsClient'
import { mswServer } from '../mswServer'

// tests/setup.ts mocks env with analytics off; these modules read only these.
vi.mock('@/lib/env', () => ({
  apiBaseUrl: 'https://api.test',
  enableAnalytics: true,
  isDevelopment: false,
  allowDemoFallback: false,
}))

const V4_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const TAB_SIGN_IN_KEY = 'stoa_tab_sign_in'

/** A crypto as those browsers have it: getRandomValues, no randomUUID. */
function withoutRandomUUID() {
  const real = globalThis.crypto
  const getRandomValues = vi.fn(<T extends ArrayBufferView>(array: T): T => real.getRandomValues(array))
  vi.stubGlobal('crypto', { getRandomValues, subtle: real.subtle })
  expect(crypto.randomUUID).toBeUndefined()
  return getRandomValues
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the browser sign-in id without crypto.randomUUID', () => {
  it('is a v4 UUID from getRandomValues when this tab signs in', async () => {
    const getRandomValues = withoutRandomUUID()
    const loggedOut: unknown[] = []
    mswServer.use(
      http.post('https://api.test/auth/logout', async ({ request }) => {
        loggedOut.push(((await request.json()) as { access_token?: unknown }).access_token)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    signInTab('ada-access', 'ada-refresh')
    const first = readBrowserSignIn()!.id
    signInTab('bea-access', 'bea-refresh')
    const second = readBrowserSignIn()!.id

    expect(first).toMatch(V4_UUID)
    expect(second).toMatch(V4_UUID)
    expect(second).not.toBe(first)
    expect(sessionStorage.getItem(TAB_SIGN_IN_KEY)).toBe(second)
    expect(getRandomValues).toHaveBeenCalled()
    // The sign-in the second one replaced is still ended on the server.
    await vi.waitFor(() => expect(loggedOut).toEqual(['ada-access']), { timeout: 5000 })
  })

  it('is a v4 UUID when start-up keeps the one saved account of ADR 0002', () => {
    withoutRandomUUID()
    localStorage.setItem('stoa_dev_sessions', JSON.stringify([{ accessToken: 'ada-access', email: 'a@test.stoaedu.ch' }]))

    migrateSavedAccounts()

    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access' })
    expect(readBrowserSignIn()!.id).toMatch(V4_UUID)
  })

  it('is a v4 UUID when a tab from before #320 becomes the browser sign-in', () => {
    withoutRandomUUID()
    sessionStorage.setItem(TAB_TOKEN_KEY, 'ada-access')

    initializeTab()

    const signIn = readBrowserSignIn()!
    expect(signIn).toMatchObject({ accessToken: 'ada-access' })
    expect(signIn.id).toMatch(V4_UUID)
    expect(sessionStorage.getItem(TAB_SIGN_IN_KEY)).toBe(signIn.id)
  })
})

describe('the analytics session without crypto.randomUUID', () => {
  /** The session id of each analytics event sent, in order. */
  function sessionIds() {
    const sent: unknown[] = []
    mswServer.use(
      http.post('https://api.test/analytics/events', async ({ request }) => {
        sent.push(((await request.json()) as { sessionId?: unknown }).sessionId)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    return sent
  }

  it('is one v4 UUID for the tab, and a new one after it rotates', async () => {
    withoutRandomUUID()
    const sent = sessionIds()

    // One at a time, so the ids arrive in the order the events were sent.
    const send = async () => {
      const count = sent.length
      trackEvent('chat_message_sent', {})
      await vi.waitFor(() => expect(sent).toHaveLength(count + 1), { timeout: 5000 })
    }
    await send()
    await send()
    rotateAnalyticsSession()
    await send()

    const [first, again, next] = sent
    expect(first).toMatch(V4_UUID)
    expect(again).toBe(first)
    expect(next).toMatch(V4_UUID)
    expect(next).not.toBe(first)
  })
})
