import axios from 'axios'
import { fetchAuthSession } from 'aws-amplify/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30_000,
})

// Inject Cognito JWT on every request
api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Not authenticated — let request proceed (public routes)
  }
  return config
})

// 401 → sign out
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { signOut } = await import('aws-amplify/auth')
      await signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
