/**
 * Several requests answering 401 on the same expired token (#207).
 *
 * They share one renewal, as they should. But the first caller to resume
 * stored the new token, and every later one then saw a token different from
 * the one it sent and took it for "signed out, or another account signed in"
 * (#34): it failed with `session_changed` instead of retrying. After an idle
 * hour, every request on the first page load but one failed once.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readBrowserSignIn } from '@/lib/tabAccount'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

let refreshCalls = 0
const seen: string[] = []
// The refresh answers only when a test lets it, so the order of events is set
// by the test rather than by timers (#210 audit).
let releaseRefresh: () => void = () => undefined
let refreshGate: Promise<void> = Promise.resolve()

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  refreshCalls = 0
  seen.length = 0
  refreshGate = new Promise((resolve) => { releaseRefresh = resolve })
  localStorage.clear()
  sessionStorage.clear()
  sessionStorage.setItem(TOKEN_KEY, 'expired-access')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'expired-access', isAuthenticated: true })
  mswServer.use(
    http.get('https://api.test/things/:id', ({ request, params }) => {
      const auth = request.headers.get('authorization')
      seen.push(`${params.id} ${auth}`)
      if (auth !== 'Bearer fresh-access') return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      return HttpResponse.json({ id: params.id })
    }),
    http.post('https://api.test/auth/refresh', async () => {
      refreshCalls += 1
      await refreshGate
      return HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-1' })
    }),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

describe('three requests on one expired token', () => {
  it('renew once and all retry with the new token', async () => {
    const pending = Promise.allSettled(['a', 'b', 'c'].map((id) => httpClient.get(`/things/${id}`)))
    // All three have failed and are waiting on the one renewal before it answers.
    await vi.waitFor(() => expect(seen).toHaveLength(3))
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    releaseRefresh()
    const answers = await pending

    expect(answers.map((answer) => answer.status)).toEqual(['fulfilled', 'fulfilled', 'fulfilled'])
    expect(refreshCalls).toBe(1)
    expect(seen.filter((line) => line.endsWith('Bearer fresh-access')).sort()).toEqual([
      'a Bearer fresh-access',
      'b Bearer fresh-access',
      'c Bearer fresh-access',
    ])
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
  })
})

describe('the session changing while the renewal is in flight (#34)', () => {
  it('still refuses to retry when another account signed in meanwhile', async () => {
    const pending = Promise.allSettled(['a', 'b'].map((id) => httpClient.get(`/things/${id}`)))
    // Both have failed and the renewal is out; another account signs in
    // before it comes back.
    await vi.waitFor(() => expect(seen).toHaveLength(2))
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    // The way sign-in does it: a new access token and that account's own
    // refresh token. Only the refresh token tells another account from this
    // one renewed by another tab (#219).
    useAuthStore.getState().setAuth(
      { id: 'u-2', name: 'Someone', email: 'someone@test.stoaedu.ch', role: 'student' },
      'someone-else',
      'refresh-someone',
    )
    releaseRefresh()

    const answers = await pending

    expect(answers.every((answer) => answer.status === 'rejected')).toBe(true)
    for (const answer of answers) {
      expect((answer as PromiseRejectedResult).reason).toMatchObject({ code: 'session_changed' })
    }
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('someone-else')
    expect(sessionStorage.getItem('stoa_tab_refresh_token')).toBe('refresh-someone')
    expect(seen.some((line) => line.endsWith('Bearer fresh-access'))).toBe(false)
    expect(seen.some((line) => line.endsWith('Bearer someone-else'))).toBe(false)
  })
})

describe('a renewal that hands back the same access token', () => {
  it('is not taken for one a sibling request already stored', async () => {
    // Only the first caller can tell: the tab's token equals the one returned,
    // but nothing was renewed. It takes the ordinary path, which retries once
    // and ends the session on the second 401 (#210 audit).
    mswServer.use(
      http.post('https://api.test/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'expired-access', refreshToken: 'refresh-2' }),
      ),
    )
    localStorage.setItem('stoa_sign_in', JSON.stringify({ id: 's', accessToken: 'expired-access', refreshToken: 'refresh-1' }))
    sessionStorage.setItem('stoa_tab_sign_in', 's')
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, pathname: '/', assign })

    await expect(httpClient.get('/things/a')).rejects.toBeDefined()

    // The session ended, and with it the browser's sign-in (#320).
    expect(readBrowserSignIn()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
    vi.unstubAllGlobals()
  })
})
