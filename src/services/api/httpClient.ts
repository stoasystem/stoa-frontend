import axios from 'axios'
import { apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import { currentSessionToken, useAuthStore } from '@/store/authStore'
import { renewHeldSession } from '@/lib/devSessions'
import { isSameSession, renewSession, storedRefreshToken } from '@/services/auth/sessionRefresh'
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

/**
 * The refresh token each request went out under. Beside the config rather
 * than on it: a config travels with every response and error, and anything
 * that logs one would log the credential (#218 audit).
 */
const refreshSent = new WeakMap<object, string>()

httpClient.interceptors.request.use((config) => {
  // This tab's own token: no other tab's sign-in changes it (#216).
  const token = currentSessionToken()
  refreshSent.delete(config)

  config.headers['Accept-Language'] = activeLanguage()

  if (isPublicAuthPath(config.url, config.method)) {
    delete config.headers.Authorization
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`
    // Which session the request went out under. The access token alone cannot
    // say: a renewal replaces it, here or in another tab (#218, #219).
    const refresh = storedRefreshToken()
    if (refresh) refreshSent.set(config, refresh)
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
 * Only this tab's session: clearAuth leaves other tabs as they are, and this
 * tab stays signed out rather than falling back on a saved account (#216,
 * #217).
 */
function endSession(): never | Promise<never> {
  useAuthStore.getState().clearAuth()
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
  return Promise.reject(new Error('session_ended'))
}

/**
 * The session a request went out under: the access token it carried (null:
 * none) and the refresh token stored beside it then. The access token says
 * whether the request is on the tab's token now; only the refresh token can
 * say whether a different token is still the same session, renewed since
 * (#218, #219).
 */
export type SentSession = { token: string | null; refresh: string | null }

/** How the request already went out again: after a renewal, or once more as it was. */
export type SentAgain = { retried: boolean; resent: boolean }

/**
 * Send the request again with `token`. `renewed` says this follows a renewal:
 * a 401 then ends the session. Otherwise the session had been renewed already,
 * and the request is only being sent once more on the token the tab holds now.
 */
export type Retry<T> = (token: string, renewed: boolean) => Promise<T>

/**
 * What to do with a 401 on a request that went out under `sent`. The one
 * answer for every request this app sends with the session's token, through
 * the shared client or not (#215).
 *
 * Null when the 401 is not this tab's session's to answer: it only says the
 * session the request carried is over, and if this tab now holds a different
 * one - the sender signed out and someone signed in since, or a request sent
 * before anyone signed in answers late - that is not the session that failed,
 * and it stays (#34). The caller reports the 401 as an ordinary failure.
 *
 * Unless the session is the same one, already renewed: the request went out
 * with the token a renewal has since replaced - a sibling request's, whose 401
 * came first, or another tab's sharing the session - and its 401 came after.
 * It is sent once more on the token the tab holds now, without a renewal of
 * its own (#218). A tab that signed out, or where someone else signed in,
 * holds another refresh token or none, and the 401 stays an ordinary one.
 *
 * Otherwise a promise: the retry's result, or a rejection when the session
 * ended, changed meanwhile, or could not be renewed right now.
 */
export function answerUnauthorized<T>(
  sent: SentSession,
  again: SentAgain,
  retry: Retry<T>,
): Promise<T> | null {
  const now = currentSessionToken()
  if (sent.token !== now) {
    if (sent.token && now && !again.resent && isSameSession(sent.refresh)) {
      return resendOnRenewedSession(now, retry)
    }
    return null
  }
  if (again.retried) return endSession()
  return renewAndRetry(sent, retry)
}

/**
 * The tab's token is not the one a request was sent with, but the session is
 * the same one, renewed since. Send it again with the token the tab holds now.
 */
function resendOnRenewedSession<T>(token: string, retry: Retry<T>): Promise<T> {
  // A renewal in this tab wrote the token; keep the store on it too.
  useAuthStore.getState().hydrateFromStorage()
  return retry(token, false)
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
function renewAndRetry<T>(sent: SentSession, retry: Retry<T>): Promise<T> {
  return renewSession().then((renewal) => {
    const token = renewal.status === 'renewed' ? renewal.accessToken : null
    // Requests that failed together share one renewal, and the first to
    // resume stores its token. For the rest the tab's token has changed,
    // but to the one this same renewal brought back: that is this session
    // renewed, not another one, and they retry with it (#207).
    // (A server handing back the very token it was sent renews nothing:
    // that first caller still takes the ordinary path below.)
    const renewedByThisRenewal =
      token !== null && token !== sent.token && currentSessionToken() === token
    // Signed out, or another account signed in, while the renewal was in
    // flight: the token it brings back is the old session's, and storing
    // it would sign that account straight back in (#34, #172 audit).
    if (currentSessionToken() !== sent.token && !renewedByThisRenewal) {
      // Another renewal in this tab got there first and stored its token;
      // this tab's refresh token is still the one the request went out
      // under. Same session: retry with that token rather than failing as
      // if someone else had signed in (#219). Not after an ended renewal:
      // that one says this tab's refresh token is no good.
      const now = currentSessionToken()
      if (now && renewal.status !== 'ended' && isSameSession(sent.refresh)) {
        useAuthStore.getState().hydrateFromStorage()
        return retry(now, true)
      }
      // The tab may still hold a session, just not this one: another
      // account signed in. Read the account again under whatever the tab
      // holds now, or a start-up in a second restored tab waits on "Konto
      // wird geladen…" for good.
      if (now) {
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
      if (sent.token && renewal.status === 'renewed') renewHeldSession(sent.token, renewal)
    }
    return retry(token, true)
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
      // looping: the second 401 falls through to signing out. `resent` lets a
      // request go out once more on a session renewed meanwhile, and only once.
      const config = error.config as
        | (typeof error.config & { _retried?: boolean; _resent?: boolean })
        | undefined
      const answered = answerUnauthorized(
        { token: tokenSent(config), refresh: config ? refreshSent.get(config) ?? null : null },
        // No config counts as retried and resent: there is nothing to send again.
        { retried: !config || Boolean(config._retried), resent: !config || Boolean(config._resent) },
        (_token, renewed) => {
          // Not reached (no config counts as retried); it narrows the type.
          if (!config) return endSession()
          // The request interceptor puts the tab's token on it.
          if (renewed) config._retried = true
          else config._resent = true
          return httpClient.request(config)
        },
      )
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
