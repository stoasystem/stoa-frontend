import axios from 'axios'
import { apiBaseUrl } from '@/lib/env'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'

export const httpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
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

    if (status === 403 && window.location.pathname !== '/forbidden') {
      window.location.assign('/forbidden')
    }

    const message = error.response?.data?.message ?? error.message ?? 'Unknown API error'
    return Promise.reject(new Error(message))
  },
)
