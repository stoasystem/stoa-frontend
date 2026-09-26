import { releaseTab, tabToken } from '@/lib/devSessions'
import axios from 'axios'
import { apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'

export class ApiError extends Error {
  status?: number
  detail?: unknown
  code?: string

  constructor(message: string, options: { status?: number; detail?: unknown; code?: string } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.detail = options.detail
    this.code = options.code
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
  const token = tabToken() ?? localStorage.getItem(TOKEN_KEY)

  config.headers['Accept-Language'] = activeLanguage()

  if (isPublicAuthPath(config.url, config.method)) {
    delete config.headers.Authorization
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Logging out with a token that already expired or was revoked answers
    // 401. That session is over either way, and the caller finishes signing
    // out itself; clearing and reloading here as well would race it.
    if (status === 401 && requestPath(error.config?.url) !== LOGOUT_PATH) {
      // A tab pinned to one test role fails on that role's own token. Dropping
      // the pin is enough; clearing here would take the session the rest of the
      // browser shares down with it, which is not what expired.
      if (tabToken()) {
        releaseTab()
      } else {
        useAuthStore.getState().clearAuth()
      }
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    const detail = error.response?.data?.detail ?? error.response?.data?.message
    const message = typeof detail === 'object' && detail !== null && 'message' in detail
      ? String(detail.message)
      : typeof detail === 'string'
        ? detail
        : error.message ?? 'Unknown API error'
    const code = typeof detail === 'object' && detail !== null && 'code' in detail
      ? String(detail.code)
      : undefined

    return Promise.reject(new ApiError(message, { status, detail, code }))
  },
)
