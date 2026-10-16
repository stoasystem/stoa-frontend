import axios from 'axios'
import { apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import { currentSessionToken, useAuthStore } from '@/store/authStore'
import { renewHeldSession } from '@/lib/devSessions'
import { renewSession } from '@/services/auth/sessionRefresh'
import { queryClient } from '@/app/query/queryClient'

export class ApiError extends Error {
  status?: number
  detail?: unknown
  code?: string
  // Axios's own code for how the request failed (ETIMEDOUT, ERR_NETWORK, ...).
  // `code` above is the backend's; without this a timeout and a dropped
  // connection look the same once they reach the caller.
  transportCode?: string

  constructor(
    message: string,
    options: { status?: number; detail?: unknown; code?: string; transportCode?: string } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.detail = options.detail
    this.code = options.code
    this.transportCode = options.transportCode
  }
}

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const LOGOUT_PATH = '/auth/logout'

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/forgot-password',
  '/auth/login',
  LOGOUT_PATH,
  '/auth/login-code/confirm',
  '/auth/login-code/request',
  '/auth/register',
  '/auth/reset-password',
  '/auth/email-verification/confirm',
  '/auth/email-verification/resend',
])

/**
 * The language the screen is rendered in, for `Accept-Language`.
 *
 * Curriculum titles, question history and assistant answers are chosen
 * server-side, and used to be chosen from the stored profile preference. That
 * lags a language switch by a round trip, so the first refetch after the switch
 * still came back in the old language. Sending it on the request removes the
 * lag entirely.
 */
function requestPath(url?: string) {
  if (!url) return ''
  try {
    return new URL(url, apiBaseUrl).pathname
  } catch {
    return url.split('?')[0]
  }
}

function isPublicAuthPath(url?: string, method?: string) {
  const path = requestPath(url)
  if (PUBLIC_AUTH_PATHS.has(path)) return true

  const verb = (method || 'get').toLowerCase()
  if (path === '/teacher-applications' && verb === 'post') return true
  if (path === '/teacher-applications/activation/claim' && verb === 'post') return true
  if (/^\/teacher-applications\/[^/]+\/status$/.test(path) && verb === 'get') return true
  return false
}

httpClient.interceptors.request.use((config) => {
  // A tab holding its own role must send that role's token, not the one
  // the rest of the browser shares.
  const token = currentSessionToken()

  config.headers['Accept-Language'] = activeLanguage()

  if (isPublicAuthPath(config.url, config.method)) {
    delete config.headers.Authorization
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/** The token a request went out with, or null when it carried none. */
function tokenSent(config?: { headers?: unknown }): string | null {
  const headers = config?.headers as
    | { get?: (name: string) => unknown; Authorization?: unknown }
    | undefined
  const value = typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization
  if (typeof value !== 'string' || !value.startsWith('Bearer ')) return null
  return value.slice('Bearer '.length)
}

/**
 * The code a request fails with when its session could not be renewed because
 * the server was out of reach. The session is intact; trying again later is
 * the right answer, signing in again is not.
 */
export const SESSION_UNREACHABLE = 'session_unreachable'

/**
 * The session is over: drop it and go to sign-in.
 *
 * A tab pinned to one test role fails on that role's own token; clearing drops
 * the pin and leaves the session the rest of the browser shares, refresh token
 * included (#211): clearAuth clears only this tab's.
 */
function endSession(): never | Promise<never> {
  useAuthStore.getState().clearAuth()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
  return Promise.reject(new Error('session_ended'))
}

/**
 * What to do with a 401 on a request that went out with `sent` (null: no
 * token). The one answer for every request this app sends with the session's
 * token, through the shared client or not (#215).
 *
 * Null when the 401 is not this tab's session's to answer: it only says the
 * session the request carried is over, and if this tab now holds a different
 * one - the sender signed out and someone signed in since, or a request sent
 * before anyone signed in answers late - that is not the session that failed,
 * and it stays (#34). The caller reports the 401 as an ordinary failure.
 *
 * Otherwise a promise: the retry's result, or a rejection when the session
 * ended, changed meanwhile, or could not be renewed right now. `retried` says
 * the request already went out again with a fresh token; a 401 then ends the
 * session.
 */
export function answerUnauthorized<T>(
  sent: string | null,
  retried: boolean,
  retry: (token: string) => Promise<T>,
): Promise<T> | null {
  if (sent !== currentSessionToken()) return null
  if (retried) return endSession()
  return renewAndRetry(sent, retry)
}

/**
 * A request sent with `sent` was answered 401 and `sent` is still this tab's
 * token: renew the session once and, if it is still the same session, retry.
 *
 * An expired access token is not the end of the session: there is a refresh
 * token for exactly this, and using it is the difference between a reader
 * staying signed in and being thrown out every hour. Only when the refresh is
 * refused is the session really over.
 *
 * `retry` is called at most once, with the token to send.
 */
function renewAndRetry<T>(sent: string | null, retry: (token: string) => Promise<T>): Promise<T> {
  return renewSession().then((renewal) => {
    const token = renewal.status === 'renewed' ? renewal.accessToken : null
    // Requests that failed together share one renewal, and the first to
    // resume stores its token. For the rest the tab's token has changed,
    // but to the one this same renewal brought back: that is this session
    // renewed, not another one, and they retry with it (#207).
    // (A server handing back the very token it was sent renews nothing:
    // that first caller still takes the ordinary path below.)
    const renewedByThisRenewal =
      token !== null && token !== sent && currentSessionToken() === token
    // Signed out, or another account signed in, while the renewal was in
    // flight: the token it brings back is the old session's, and storing
    // it would sign that account straight back in (#34, #172 audit).
    if (currentSessionToken() !== sent && !renewedByThisRenewal) {
      // The tab may still hold a session, just not this one: another tab
      // sharing it renewed first, or another account signed in. Read the
      // account again under whatever the tab holds now, or a start-up in
      // a second restored tab waits on "Konto wird geladen…" for good.
      if (currentSessionToken()) {
        useAuthStore.getState().hydrateFromStorage()
        // After this rejection has settled: while the first read of the
        // account is still in flight, an invalidation only joins it.
        setTimeout(() => void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }), 0)
      }
      return Promise.reject(new ApiError('The session changed while it was being renewed.', { status: 401, code: 'session_changed' }))
    }
    // The server could not be reached (network, timeout, 5xx, 429). It
    // refused nothing, so the session stays — access token, refresh
    // tokens, held accounts — and this request fails on its own. The
    // next 401 tries the renewal again (#214). No status: this is not a
    // 401 a caller should read as "signed out".
    if (renewal.status === 'unreachable') {
      return Promise.reject(new ApiError('The session could not be renewed right now.', { code: SESSION_UNREACHABLE }))
    }
    if (!token) return endSession()
    // The first caller stores the token and moves the held entry; the
    // others find both done.
    if (!renewedByThisRenewal) {
      // Only the token: at start-up the account has not been read yet.
      useAuthStore.getState().updateAccessToken(token)
      // The account menu holds this account too; keep it on the same pair,
      // or signing out leaves it there dead (#162).
      if (sent && renewal.status === 'renewed') renewHeldSession(sent, renewal)
    }
    return retry(token)
  })
}

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Logging out with a token that already expired or was revoked answers
    // 401. That session is over either way, and the caller finishes signing
    // out itself; clearing and reloading here as well would race it.
    if (status === 401 && requestPath(error.config?.url) !== LOGOUT_PATH) {
      // `retried` keeps a request that fails again after a fresh token from
      // looping: the second 401 falls through to signing out.
      const config = error.config as (typeof error.config & { _retried?: boolean }) | undefined
      const answered = answerUnauthorized(tokenSent(config), !config || Boolean(config._retried), () => {
        // Not reached (no config counts as retried); it narrows the type.
        if (!config) return endSession()
        config._retried = true
        return httpClient.request(config)
      })
      if (answered) return answered
    }

    const detail = error.response?.data?.detail ?? error.response?.data?.message
    const message = typeof detail === 'object' && detail !== null && 'message' in detail
      ? String(detail.message)
      : typeof detail === 'string'
        ? detail
        : error.message ?? 'Unknown API error'
    // The backend sends its code two ways: under `detail` ({detail: {code,
    // message}}), and flat ({code, message, correlationId}) for an identity
    // provider's refusal (`safe_error_body`): an unconfirmed account, a wrong
    // or expired verification code. Read only under `detail`, the flat one was
    // lost (#185 review).
    const flatCode = error.response?.data?.code
    const code = typeof detail === 'object' && detail !== null && 'code' in detail
      ? String(detail.code)
      : typeof flatCode === 'string'
        ? flatCode
        : undefined

    const transportCode = typeof error.code === 'string' ? error.code : undefined

    return Promise.reject(new ApiError(message, { status, detail, code, transportCode }))
  },
)
