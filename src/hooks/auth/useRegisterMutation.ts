import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { register, type RegisterRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'
import type { AuthResponse } from '@/types/user'

function requiresEmailVerification(data: AuthResponse) {
  return data.emailVerificationRequired || data.onboardingStatus === 'email_verification_required' || !data.accessToken
}

export function useRegisterMutation(options: { redirect?: boolean } = {}) {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
    onSuccess: (data) => {
      const emailVerificationRequired = requiresEmailVerification(data)
      if (data.verificationStatus === 'pending_review' || emailVerificationRequired) {
        clearAuth()
      } else {
        setAuth(data.user, data.accessToken)
      }
      trackEvent('user_register', { role: data.user.role, userId: data.user.id })
      if (data.verificationStatus === 'pending_review') {
        toast.success('Teacher application submitted')
      } else if (emailVerificationRequired) {
        toast.success('Check your email to verify your account')
      } else {
        toast.success('Account created')
      }
      if (options.redirect !== false) {
        if (data.verificationStatus === 'pending_review') {
          navigate('/teacher-support')
          return
        }
        if (emailVerificationRequired) return
        navigate(data.user.role === 'student' ? '/chat' : getDefaultRouteForRole(data.user.role))
      }
    },
    onError: () => {
      toast.error('Registration failed')
    },
  })
}
