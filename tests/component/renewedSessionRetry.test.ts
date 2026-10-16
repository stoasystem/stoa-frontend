/**
 * A 401 that arrives after the session was already renewed (#218, #219).
 *
 * F2: two requests go out on one expired token. The fast one's 401 renews the
 * session and retries; the slow one's 401 only arrives after that, when the
 * tab holds the new token. The #34 guard took "the tab's token is not the one
 * I sent" for "someone else's session now" and failed it with a plain 401. A
 * query retries by itself; a submit and the account read (`['auth','me']`,
 * `retry: false`) did not.
 *
 * F3: two tabs share one session and renew at once, each with its own renewal
 * in flight. The first stores its token; the second found a token it neither
 * sent nor got back and failed with `session_changed`.
 *
 * Both are the same session renewed, and the refresh token says so: a renewal
 * keeps it, while signing in, signing out and switching accounts replace or
 * clear it. What #34 protects still holds: a late 401 from the previous
 * account neither retries under the next one nor signs it out.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api/httpClient'
import { pinTabToSession, TAB_TOKEN_KEY } from '@/lib/devSessions'
import { rememberRefreshToken, replaceRefreshToken } from '@/services/auth/sessionRefresh'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const SHARED_REFRESH = 'stoa_refresh_token'
const bea = { id: 'u-b', name: 'Bea', email: 'bea@example.com', role: 'parent' } as CurrentUser

// Tokens the server accepts. Anything else answers 401.
const LIVE = new Set(['fresh-access', 'other-tab-access', 'token-b'])

function gate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { opened, open }
}

let refreshCalls = 0
let refreshAnswer: { accessToken: string; refreshToken?: string } = { accessToken: 'fresh-access', refreshToken: 'refresh-1' }
let refreshGate: Promise<void> = Promise.resolve()
const seen: string[] = []
const assign = vi.fn()

function authorised(request: Request, label: string) {
  const auth = request.headers.get('authorization')
  seen.push(`${label} ${auth}`)
  const token = auth?.replace('Bearer ', '') ?? ''
  return LIVE.has(token)
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  refreshCalls = 0
  seen.length = 0
  refreshAnswer = { accessToken: 'fresh-access', refreshToken: 'refresh-1' }
  refreshGate = Promise.resolve()
  assign.mockReset()
  vi.stubGlobal('location', { ...window.location, pathname: '/', assign })
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem(TOKEN_KEY, 'expired-access')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'expired-access', isAuthenticated: true })
  mswServer.use(
    http.post('https://api.test/auth/refresh', async () => {
      refreshCalls += 1
      await refreshGate
      return HttpResponse.json(refreshAnswer)
    }),
    http.get('https://api.test/things/fast', ({ request }) =>
      authorised(request, 'fast')
        ? HttpResponse.json({ ok: true })
        : HttpResponse.json({ detail: 'expired' }, { status: 401 }),
    ),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** A request whose first answer waits until the test opens `late`. */
function slowRoute(method: 'get' | 'post', path: string, late: Promise<void>, served: () => void) {
  let first = true
  return http[method](`https://api.test${path}`, async ({ request }) => {
    const ok = authorised(request, 'slow')
    if (first) {
      first = false
      served()
      await late
    }
    return ok ? HttpResponse.json({ ok: true }) : HttpResponse.json({ detail: 'expired' }, { status: 401 })
  })
}

describe('a 401 that arrives after this tab renewed the session (F2)', () => {
  it('retries a submit with the renewed token', async () => {
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', { name: 'x' })
    await served.opened
    await expect(httpClient.get('/things/fast')).resolves.toMatchObject({ data: { ok: true } })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh-access')

    late.open()
    await expect(slow).resolves.toMatchObject({ data: { ok: true } })
    expect(seen).toContain('slow Bearer fresh-access')
    // The renewal already happened; the late one does not start another.
    expect(refreshCalls).toBe(1)
    expect(assign).not.toHaveBeenCalled()
  })

  it('retries the account read with the renewed token', async () => {
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('get', '/auth/me', late.opened, served.open))

    const me = httpClient.get('/auth/me')
    await served.opened
    await httpClient.get('/things/fast')

    late.open()
    await expect(me).resolves.toMatchObject({ data: { ok: true } })
    expect(seen).toContain('slow Bearer fresh-access')
    expect(refreshCalls).toBe(1)
  })

  it('follows the refresh token through a renewal that rotated it', async () => {
    refreshAnswer = { accessToken: 'fresh-access', refreshToken: 'refresh-2' }
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', {})
    await served.opened
    await httpClient.get('/things/fast')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('refresh-2')

    late.open()
    await expect(slow).resolves.toMatchObject({ data: { ok: true } })
    expect(refreshCalls).toBe(1)
  })

  it('resends only once, then renews like any other 401', async () => {
    // The token the tab holds now is dead too: the resend answers 401 on the
    // tab's own token, which renews; the refused renewal ends the session.
    const late = gate()
    const served = gate()
    mswServer.use(
      http.post('https://api.test/things', async ({ request }) => {
        seen.push(`slow ${request.headers.get('authorization')}`)
        served.open()
        await late.opened
        return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      }),
      http.post('https://api.test/auth/refresh', () => {
        refreshCalls += 1
        return HttpResponse.json({ detail: 'refused' }, { status: 401 })
      }),
    )
    // Sent on the old token; the tab renewed (here: stored a new one) since.
    const request = httpClient.post('/things', {})
    await served.opened
    localStorage.setItem(TOKEN_KEY, 'renewed-but-dead')
    late.open()

    await expect(request).rejects.toBeDefined()
    expect(seen.filter((line) => line.startsWith('slow'))).toEqual([
      'slow Bearer expired-access',
      'slow Bearer renewed-but-dead',
    ])
    expect(refreshCalls).toBe(1)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('does not resend again when the token has moved on once more', async () => {
    // Every answer finds the tab on yet another token of the same session.
    // Without a limit each 401 would resend, for as long as that went on.
    let answered = 0
    mswServer.use(
      http.post('https://api.test/things', ({ request }) => {
        seen.push(`slow ${request.headers.get('authorization')}`)
        answered += 1
        if (answered < 5) localStorage.setItem(TOKEN_KEY, `moved-${answered}`)
        return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      }),
    )

    await expect(httpClient.post('/things', {})).rejects.toMatchObject({ status: 401 })
    expect(seen.filter((line) => line.startsWith('slow'))).toEqual([
      'slow Bearer expired-access',
      'slow Bearer moved-1',
    ])
    expect(refreshCalls).toBe(0)
  })
})

describe('another tab on the same session renewed first (F3)', () => {
  it("retries with the other tab's token instead of failing as session_changed", async () => {
    const released = gate()
    refreshGate = released.opened
    refreshAnswer = { accessToken: 'this-tab-access', refreshToken: 'refresh-1' }

    const request = httpClient.get('/things/fast')
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    // The other tab's renewal finished first and stored its token in the
    // storage both tabs share; the refresh token is the one both spent.
    localStorage.setItem(TOKEN_KEY, 'other-tab-access')
    released.open()

    await expect(request).resolves.toMatchObject({ data: { ok: true } })
    expect(seen).toContain('fast Bearer other-tab-access')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('other-tab-access')
    expect(useAuthStore.getState().accessToken).toBe('other-tab-access')
    expect(assign).not.toHaveBeenCalled()
  })

  it("retries a late 401 with the token the other tab stored, without renewing", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', {})
    await served.opened
    localStorage.setItem(TOKEN_KEY, 'other-tab-access')
    late.open()

    await expect(slow).resolves.toMatchObject({ data: { ok: true } })
    expect(seen).toContain('slow Bearer other-tab-access')
    expect(refreshCalls).toBe(0)
  })
})

describe('a different account in the tab now (#34)', () => {
  it("does not retry A's late 401 under B, nor sign B out", async () => {
    localStorage.setItem(TOKEN_KEY, 'token-a')
    rememberRefreshToken('refresh-a')
    useAuthStore.setState({ accessToken: 'token-a' })
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', {})
    await served.opened
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setAuth(bea, 'token-b', 'refresh-b')
    late.open()

    await expect(slow).rejects.toMatchObject({ status: 401 })
    expect(seen).not.toContain('slow Bearer token-b')
    expect(refreshCalls).toBe(0)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-b')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('refresh-b')
    expect(useAuthStore.getState().user?.id).toBe('u-b')
    expect(assign).not.toHaveBeenCalled()
  })

  it('still fails as session_changed when B signed in during the renewal', async () => {
    const released = gate()
    refreshGate = released.opened

    const request = httpClient.get('/things/fast')
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    useAuthStore.getState().setAuth(bea, 'token-b', 'refresh-b')
    released.open()

    await expect(request).rejects.toMatchObject({ code: 'session_changed' })
    expect(seen).not.toContain('fast Bearer token-b')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-b')
    expect(assign).not.toHaveBeenCalled()
  })

  it("does not retry A's late 401 after the tab switched to held account B", async () => {
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', {})
    await served.opened
    // What the account menu does: pin the tab to B and put B's refresh token
    // in the tab's place (useHeldAccounts.switchTo).
    pinTabToSession('token-b')
    replaceRefreshToken('refresh-b')
    late.open()

    await expect(slow).rejects.toMatchObject({ status: 401 })
    expect(seen).not.toContain('slow Bearer token-b')
    expect(refreshCalls).toBe(0)
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('token-b')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('refresh-1')
    expect(assign).not.toHaveBeenCalled()
  })

  it('keeps the refresh token off the request config', async () => {
    mswServer.use(
      http.get('https://api.test/things/plain', () => HttpResponse.json({ ok: true })),
    )
    localStorage.setItem(TOKEN_KEY, 'fresh-access')
    const response = await httpClient.get('/things/plain')
    expect(JSON.stringify(response.config)).not.toContain('refresh-1')
  })

  it('does not retry when the tab signed out and nobody signed in', async () => {
    const late = gate()
    const served = gate()
    mswServer.use(slowRoute('post', '/things', late.opened, served.open))

    const slow = httpClient.post('/things', {})
    await served.opened
    useAuthStore.getState().clearAuth()
    late.open()

    await expect(slow).rejects.toMatchObject({ status: 401 })
    expect(seen.filter((line) => line.startsWith('slow'))).toHaveLength(1)
    expect(refreshCalls).toBe(0)
  })
})
