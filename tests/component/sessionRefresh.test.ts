import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  forgetRefreshToken,
  refreshAccessToken,
  rememberRefreshToken,
  storedRefreshToken,
} from '@/services/auth/sessionRefresh'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'

// A reader's session used to end with their access token, an hour after they
// signed in. `/auth/refresh` and the refresh token were both there; nothing
// called one with the other. People read it as "signed out after every
// release", because a release is when they come back to the tab.

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response
const refused = (status: number) => ({ ok: false, status, json: async () => ({}) }) as Response

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('where the refresh token is kept', () => {
  it('is the browser’s when no tab is pinned to an account', () => {
    rememberRefreshToken('r-1')

    expect(storedRefreshToken()).toBe('r-1')
    expect(localStorage.getItem('stoa_refresh_token')).toBe('r-1')
    expect(sessionStorage.getItem('stoa_tab_refresh_token')).toBeNull()
  })

  it('is the tab’s own when the tab holds its own account', () => {
    sessionStorage.setItem(TAB_TOKEN_KEY, 'access-for-this-tab')

    rememberRefreshToken('r-tab')

    expect(storedRefreshToken()).toBe('r-tab')
    expect(localStorage.getItem('stoa_refresh_token')).toBeNull()
  })

  it('treats nothing as "unchanged", not as "clear it"', () => {
    rememberRefreshToken('r-1')

    rememberRefreshToken(undefined)

    expect(storedRefreshToken()).toBe('r-1')
  })

  it('clears both when the session ends', () => {
    sessionStorage.setItem(TAB_TOKEN_KEY, 'a')
    rememberRefreshToken('r-tab')
    sessionStorage.removeItem(TAB_TOKEN_KEY)
    rememberRefreshToken('r-shared')

    forgetRefreshToken()

    expect(storedRefreshToken()).toBeNull()
  })
})

describe('exchanging it', () => {
  it('returns the new access token and keeps the one it was handed back', async () => {
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(ok({ accessToken: 'a-2', refreshToken: 'r-2' }))

    await expect(refreshAccessToken()).resolves.toBe('a-2')
    expect(storedRefreshToken()).toBe('r-2')
  })

  it('does nothing when there is nothing to exchange', async () => {
    await expect(refreshAccessToken()).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('runs one exchange for callers that ask at once', async () => {
    // Six requests meeting an expired token must not send six refreshes: the
    // later ones would carry a token the first has already replaced.
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(ok({ accessToken: 'a-2', refreshToken: 'r-2' }))

    const all = await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()])

    expect(all).toEqual(['a-2', 'a-2', 'a-2'])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('throws away a refresh token the server refuses', async () => {
    // It will never be accepted again, and keeping it makes every later 401
    // wait on a request that cannot succeed.
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(refused(401))

    await expect(refreshAccessToken()).resolves.toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('keeps it when the network failed, which is not a refusal', async () => {
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))

    await expect(refreshAccessToken()).resolves.toBeNull()
    expect(storedRefreshToken()).toBe('r-1')
  })

  it('keeps it when the server answered something other than a refusal', async () => {
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(refused(503))

    await expect(refreshAccessToken()).resolves.toBeNull()
    expect(storedRefreshToken()).toBe('r-1')
  })

  it('refuses a reply with no access token in it', async () => {
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(ok({ refreshToken: 'r-2' }))

    await expect(refreshAccessToken()).resolves.toBeNull()
  })

  it('does not send the refresh through the shared client', async () => {
    // That client's 401 handler is what calls this; a refused refresh going
    // through it would trigger another refresh.
    rememberRefreshToken('r-1')
    vi.mocked(fetch).mockResolvedValue(ok({ accessToken: 'a-2' }))

    await refreshAccessToken()

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/auth/refresh')
    expect((init as RequestInit).method).toBe('POST')
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ refresh_token: 'r-1' })
  })
})
