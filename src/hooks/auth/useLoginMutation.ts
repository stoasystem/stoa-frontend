import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { login, type LoginRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'

export function useLoginMutation() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success('Signed in')
      const from = location.state?.from?.pathname
      const search = location.state?.from?.search ?? ''
      const nextPath =
        typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
          ? `${from}${search}`
          : getDefaultRouteForRole(data.user.role)
      navigate(nextPath)
    },
    onError: () => {
      toast.error('Login failed')
    },
  })
}
