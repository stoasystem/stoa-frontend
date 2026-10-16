/**
 * The Ask stream and analytics events carry this tab's session, and the
 * stream renews it like every other request (#215, audit F6).
 *
 * Both are bare `fetch`es that read the shared `stoa_access_token` straight
 * from localStorage. A tab pinned to child B, with parent A shared, asked
 * questions as A (the audit's server saw `Bearer parent-access`) and recorded
 * its events under A. An expired token was never renewed: the student's
 * question simply failed.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { pinTabToSession, TAB_TOKEN_KEY } from '@/lib/devSessions'
import { SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { streamConversationMessage } from '@/services/chat/chatStreamApi'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

// tests/setup.ts mocks env with analytics off; these modules read only these.
vi.mock('@/lib/env', () => ({
  apiBaseUrl: 'https://api.test',
  enableAnalytics: true,
  isDevelopment: false,
  allowDemoFallback: false,
}))

const STREAM = 'https://api.test/conversations/c1/messages/stream'
const SHARED_REFRESH = 'stoa_refresh_token'
const TAB_REFRESH = 'stoa_tab_refresh_token'

/** The Authorization header of every stream request, in order. */
let streamAuth: Array<string | null> = []
let refreshCalls = 0

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  streamAuth = []
  refreshCalls = 0
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** The stream answers 401 to every token except `valid`, and 202 to that one. */
function streamAccepts(valid: string) {
  mswServer.use(
    http.post(STREAM, ({ request }) => {
      const auth = request.headers.get('Authorization')
      streamAuth.push(auth)
      return auth === `Bearer ${valid}`
        ? new HttpResponse(null, { status: 202 })
        : HttpResponse.json({ detail: 'expired' }, { status: 401 })
    }),
  )
}

function refreshAnswers(answer: () => Response | Promise<Response>) {
  mswServer.use(
    http.post('https://api.test/auth/refresh', async () => {
      refreshCalls += 1
      return answer()
    }),
  )
}

/** Parent A is the browser's shared session; this tab is pinned to child B. */
function pinnedToChild() {
  localStorage.setItem(TOKEN_KEY, 'parent-access')
  rememberRefreshToken('parent-refresh')
  pinTabToSession('child-access')
  rememberRefreshToken('child-refresh')
  useAuthStore.setState({ accessToken: 'child-access', isAuthenticated: true })
}

/** This tab shares the browser's session S. */
function onShared() {
  localStorage.setItem(TOKEN_KEY, 's-access')
  rememberRefreshToken('s-refresh')
  useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })
}

function stubLocation() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname: '/ask', assign })
  return assign
}

function ask() {
  return streamConversationMessage({
    conversationId: 'c1',
    payload: { content: 'Why?', idempotencyKey: 'k1' },
    onEvent: () => {},
  })
}

describe('the account a pinned tab sends', () => {
  it('asks a question with the pinned account\'s token, not the shared one', async () => {
    pinnedToChild()
    streamAccepts('child-access')

    await expect(ask()).resolves.toBe('accepted')

    expect(streamAuth).toEqual(['Bearer child-access'])
  })

  it('records an analytics event under the pinned account', async () => {
    pinnedToChild()
    const sent = new Promise<string | null>((resolve) => {
      mswServer.use(
        http.post('https://api.test/analytics/events', ({ request }) => {
          resolve(request.headers.get('Authorization'))
          return new HttpResponse(null, { status: 204 })
        }),
      )
    })

    trackEvent('chat_message_sent', {})

    await expect(sent).resolves.toBe('Bearer child-access')
  })
})

describe('an expired token on the stream', () => {
  it('is renewed once and the question sent again with the new token', async () => {
    pinnedToChild()
    streamAccepts('child-fresh')
    refreshAnswers(() => HttpResponse.json({ accessToken: 'child-fresh', refreshToken: 'child-refresh-2' }))

    await expect(ask()).resolves.toBe('accepted')

    expect(streamAuth).toEqual(['Bearer child-access', 'Bearer child-fresh'])
    expect(refreshCalls).toBe(1)
    // The renewal is the pinned account's, kept in the tab; the shared session
    // is untouched.
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('child-fresh')
    expect(sessionStorage.getItem(TAB_REFRESH)).toBe('child-refresh-2')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('parent-access')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('parent-refresh')
  })

  it('ends the session when the renewal is refused', async () => {
    onShared()
    const assign = stubLocation()
    streamAccepts('never')
    refreshAnswers(() => HttpResponse.json({ detail: 'refused' }, { status: 401 }))

    await expect(ask()).rejects.toThrow('session_ended')

    expect(streamAuth).toEqual(['Bearer s-access'])
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(SHARED_REFRESH)).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('ends the session when the new token is turned away too, without looping', async () => {
    onShared()
    const assign = stubLocation()
    streamAccepts('never')
    // Refused after the first, so a request that renews again and again stops
    // and shows up in the count instead of hanging the run.
    refreshAnswers(() =>
      refreshCalls === 1
        ? HttpResponse.json({ accessToken: 's-fresh' })
        : HttpResponse.json({ detail: 'refused' }, { status: 401 }),
    )

    await expect(ask()).rejects.toThrow('session_ended')

    expect(streamAuth).toEqual(['Bearer s-access', 'Bearer s-fresh'])
    expect(refreshCalls).toBe(1)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('keeps every token and stays off /login when the server cannot be reached', async () => {
    onShared()
    const assign = stubLocation()
    streamAccepts('never')
    refreshAnswers(() => HttpResponse.json({ detail: 'deploying' }, { status: 503 }))

    await expect(ask()).rejects.toMatchObject({ code: SESSION_UNREACHABLE })

    expect(streamAuth).toEqual(['Bearer s-access'])
    expect(localStorage.getItem(TOKEN_KEY)).toBe('s-access')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('s-refresh')
    expect(useAuthStore.getState().accessToken).toBe('s-access')
    expect(assign).not.toHaveBeenCalled()
  })

  it('is not sent again when someone else signed in during the renewal', async () => {
    onShared()
    const assign = stubLocation()
    streamAccepts('never')
    refreshAnswers(() => {
      // Signed out and someone else signed in while the refresh was out.
      localStorage.setItem(TOKEN_KEY, 'other-access')
      return HttpResponse.json({ accessToken: 's-fresh' })
    })

    await expect(ask()).rejects.toMatchObject({ status: 401, code: 'session_changed' })

    expect(streamAuth).toEqual(['Bearer s-access'])
    expect(localStorage.getItem(TOKEN_KEY)).toBe('other-access')
    expect(assign).not.toHaveBeenCalled()
  })

  it('is reported, not renewed, when the tab already holds another session', async () => {
    onShared()
    const assign = stubLocation()
    mswServer.use(
      http.post(STREAM, ({ request }) => {
        streamAuth.push(request.headers.get('Authorization'))
        // The answer arrives after someone else signed in.
        localStorage.setItem(TOKEN_KEY, 'other-access')
        return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      }),
    )
    refreshAnswers(() => HttpResponse.json({ accessToken: 's-fresh' }))

    await expect(ask()).rejects.toMatchObject({ status: 401 })

    expect(refreshCalls).toBe(0)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('other-access')
    expect(assign).not.toHaveBeenCalled()
  })
})
