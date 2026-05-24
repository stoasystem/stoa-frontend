import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { login, type LoginRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'

export function useLoginMutation() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success('Signed in')
      navigate(getDefaultRouteForRole(data.user.role))
    },
    onError: () => {
      toast.error('Login failed')
    },
  })
}
