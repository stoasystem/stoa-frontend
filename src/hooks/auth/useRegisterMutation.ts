import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { register, type RegisterRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'

export function useRegisterMutation() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      trackEvent('user_register', { role: data.user.role, userId: data.user.id })
      toast.success('Account created')
      navigate(getDefaultRouteForRole(data.user.role))
    },
    onError: () => {
      toast.error('Registration failed')
    },
  })
}
