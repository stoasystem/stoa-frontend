import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { login, type LoginRequest } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useLoginMutation() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(getDefaultRouteForRole(data.user.role))
    },
  })
}
