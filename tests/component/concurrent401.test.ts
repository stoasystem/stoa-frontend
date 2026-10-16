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
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

let refreshCalls = 0
const seen: string[] = []

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  refreshCalls = 0
  seen.length = 0
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem(TOKEN_KEY, 'expired-access')
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
      await new Promise((resolve) => setTimeout(resolve, 20))
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
    const answers = await Promise.allSettled(['a', 'b', 'c'].map((id) => httpClient.get(`/things/${id}`)))

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
    // Another account signs in before the renewal comes back.
    await new Promise((resolve) => setTimeout(resolve, 5))
    localStorage.setItem(TOKEN_KEY, 'someone-else')
    useAuthStore.setState({ accessToken: 'someone-else' })

    const answers = await pending

    expect(answers.every((answer) => answer.status === 'rejected')).toBe(true)
    for (const answer of answers) {
      expect((answer as PromiseRejectedResult).reason).toMatchObject({ code: 'session_changed' })
    }
    expect(localStorage.getItem(TOKEN_KEY)).toBe('someone-else')
    expect(seen.some((line) => line.endsWith('Bearer fresh-access'))).toBe(false)
  })
})
