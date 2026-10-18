/**
 * A 401 from a public auth path is not this tab's session ending (#249).
 *
 * A wrong password on a signed-out tab went through session renewal: the
 * request carried no token, the tab held none, so "the token it went out with
 * is still the tab's", there was nothing to renew with, and the interceptor
 * ended the session. `login()` failed as a bare `Error('session_ended')` with
 * the `invalid_credentials` code gone, the tab was recorded as "expired" and
 * the query cache was emptied. A 401 on any other request still renews and,
 * when that fails, ends the session as before.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { ApiError, httpClient } from '@/services/api/httpClient'
import { login } from '@/services/auth/authApi'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const TAB_STATE = 'stoa_tab_state'
const CACHED = ['cached', 'answer']

let refreshCalls = 0

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  refreshCalls = 0
  localStorage.clear()
  sessionStorage.clear()
  queryClient.clear()
  queryClient.setQueryData(CACHED, 'kept')
  mswServer.use(
    http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({ detail: 'refused' }, { status: 401 })
    }),
    http.post('https://api.test/auth/login', () =>
      HttpResponse.json(
        { detail: { code: 'invalid_credentials', message: 'Check your email and password, then try signing in again.' } },
        { status: 401 },
      )),
    http.post('https://api.test/auth/login-code/confirm', () =>
      HttpResponse.json({ code: 'invalid_code', message: 'That code is wrong or has expired.' }, { status: 401 })),
    http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  queryClient.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

function stubLocation(pathname: string) {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname, search: '', hash: '', assign })
  return assign
}

async function rejection(request: Promise<unknown>) {
  try {
    await request
  } catch (error) {
    return error
  }
  throw new Error('expected the request to fail')
}

function expectTabUntouched() {
  expect(sessionStorage.getItem(TAB_STATE)).toBeNull()
  expect(localStorage.getItem(TAB_STATE)).toBeNull()
  expect(queryClient.getQueryData(CACHED)).toBe('kept')
  expect(refreshCalls).toBe(0)
}

describe('a 401 from a public auth path on a signed-out tab', () => {
  it('a wrong password keeps its code and leaves the tab alone', async () => {
    const assign = stubLocation('/login')
    sessionStorage.setItem('stoa_login_submitted_at', '123')

    const error = await rejection(login({ email: 'reader@test.stoaedu.ch', password: 'wrong' }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'invalid_credentials' })
    expect((error as ApiError).detail).toMatchObject({ code: 'invalid_credentials' })
    expectTabUntouched()
    // The sign-in timing is kept: nothing cleared the tab's storage.
    expect(sessionStorage.getItem('stoa_login_submitted_at')).toBe('123')
    expect(assign).not.toHaveBeenCalled()
  })

  it('a refused sign-in code keeps its code and leaves the tab alone', async () => {
    const assign = stubLocation('/login')

    const error = await rejection(httpClient.post('/auth/login-code/confirm', { email: 'r@test.stoaedu.ch', code: '000000' }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'invalid_code' })
    expectTabUntouched()
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('a wrong password while adding an account', () => {
  it('fails with its code and keeps the session the tab is on', async () => {
    const assign = stubLocation('/login')
    sessionStorage.setItem(TOKEN_KEY, 's-access')
    rememberRefreshToken('s-refresh')
    useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })

    const error = await rejection(login({ email: 'other@test.stoaedu.ch', password: 'wrong' }))

    expect(error).toMatchObject({ status: 401, code: 'invalid_credentials' })
    expectTabUntouched()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('s-access')
    expect(useAuthStore.getState().accessToken).toBe('s-access')
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('a 401 on a protected request', () => {
  it('still renews and, when the renewal is refused, ends the session', async () => {
    const assign = stubLocation('/practice')
    sessionStorage.setItem(TOKEN_KEY, 's-access')
    rememberRefreshToken('s-refresh')
    useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })

    const error = await rejection(httpClient.get('/things'))

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('session_ended')
    expect(refreshCalls).toBe(1)
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(JSON.parse(sessionStorage.getItem(TAB_STATE) ?? 'null')).toMatchObject({ reason: 'expired' })
    expect(queryClient.getQueryData(CACHED)).toBeUndefined()
    expect(assign).toHaveBeenCalledWith('/login')
  })
})
