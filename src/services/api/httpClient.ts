import axios from 'axios'
import { apiBaseUrl } from '@/lib/env'
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

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/forgot-password',
  '/auth/login',
  '/auth/login-code/confirm',
  '/auth/login-code/request',
  '/auth/register',
  '/auth/reset-password',
  '/auth/email-verification/confirm',
  '/auth/email-verification/resend',
])

function isPublicAuthPath(url?: string) {
  if (!url) return false

  try {
    return PUBLIC_AUTH_PATHS.has(new URL(url, apiBaseUrl).pathname)
  } catch {
    return PUBLIC_AUTH_PATHS.has(url.split('?')[0])
  }
}

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (isPublicAuthPath(config.url)) {
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

    if (status === 401) {
      useAuthStore.getState().clearAuth()
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
