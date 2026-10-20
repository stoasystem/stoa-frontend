import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { logoutWithRefreshToken, revokeSignIn } from '@/services/auth/revokeSignIn'
import { mswServer } from '../mswServer'

// The second step a refused logout takes - spend the refresh token once, sign
// the fresh token out - is shared by sign-ins the browser drops by itself and
// by signing out (#399). Both callers go through these two.

type Answers = { stale?: number; refresh?: number | 'network-error'; fresh?: number }

// The logout answers `stale` for the dropped token and `fresh` for the renewed
// one; every body each endpoint was sent, in order.
function answer({ stale = 401, refresh = 200, fresh = 204 }: Answers = {}) {
  const logouts: unknown[] = []
  const refreshes: unknown[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async ({ request }) => {
      const body = (await request.json()) as { access_token: string }
      logouts.push(body)
      return new HttpResponse(null, { status: body.access_token === 'stale-access' ? stale : fresh })
    }),
    http.post('https://api.test/auth/refresh', async ({ request }) => {
      refreshes.push(await request.json())
      if (refresh === 'network-error') return HttpResponse.error()
      if (refresh !== 200) return HttpResponse.json({ detail: 'refused' }, { status: refresh })
      return HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'rotated-refresh' })
    }),
  )
  return { logouts, refreshes }
}

function everythingStored(): string {
  return [sessionStorage, localStorage]
    .flatMap((storage) => Array.from({ length: storage.length }, (_, index) => storage.getItem(storage.key(index) ?? '')))
    .join('\n')
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('revokeSignIn', () => {
  it('signs a dropped sign-in out with its access token when that is accepted', async () => {
    const { logouts, refreshes } = answer({ stale: 204 })

    await revokeSignIn({ accessToken: 'stale-access', refreshToken: 'old-refresh' })

    expect(logouts).toEqual([{ access_token: 'stale-access' }])
    expect(refreshes).toEqual([])
  })

  it('spends the refresh token once and signs the fresh token out when the logout is refused', async () => {
    const { logouts, refreshes } = answer()

    await revokeSignIn({ accessToken: 'stale-access', refreshToken: 'old-refresh' })

    expect(refreshes).toEqual([{ refresh_token: 'old-refresh' }])
    expect(logouts).toEqual([{ access_token: 'stale-access' }, { access_token: 'fresh-access' }])
    // Nothing of the renewal is kept.
    expect(everythingStored()).not.toMatch(/fresh-access|rotated-refresh/)
  })

  it('sends nothing more for a refused logout without a refresh token', async () => {
    const { logouts, refreshes } = answer()

    await revokeSignIn({ accessToken: 'stale-access' })

    expect(logouts).toEqual([{ access_token: 'stale-access' }])
    expect(refreshes).toEqual([])
  })

  it('does not spend the refresh token on a logout that failed rather than refused', async () => {
    const { refreshes } = answer({ stale: 500 })

    await revokeSignIn({ accessToken: 'stale-access', refreshToken: 'old-refresh' })

    expect(refreshes).toEqual([])
  })
})

describe('logoutWithRefreshToken', () => {
  it.each([
    ['ok', {}, 2],
    ['refresh-refused', { refresh: 401 }, 1],
    ['refresh-unreachable', { refresh: 'network-error' }, 1],
    ['refresh-unreachable', { refresh: 503 }, 1],
    ['logout-refused', { fresh: 401 }, 2],
    ['logout-failed', { fresh: 500 }, 2],
  ] as const)('says %s, without throwing', async (expected, answers, logoutsSent) => {
    const { logouts } = answer(answers)
    // The stale token's own logout has been refused already.
    logouts.push({ access_token: 'stale-access' })

    await expect(logoutWithRefreshToken('old-refresh')).resolves.toBe(expected)

    expect(logouts).toHaveLength(logoutsSent)
  })
})
