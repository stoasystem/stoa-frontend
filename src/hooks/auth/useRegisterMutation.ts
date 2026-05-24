import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { register, type RegisterRequest } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useRegisterMutation() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(getDefaultRouteForRole(data.user.role))
    },
  })
}
