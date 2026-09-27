import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/services/auth/authApi'
import { logger } from '@/services/logging/logger'
import { useAuthStore } from '@/store/authStore'

// The one way a person signs out, so every account menu revokes the session the
// same way (stoasystem/stoa-frontend#19). The backend is told first, while the
// token it revokes is still the one in hand; a failed call is only logged and
// never keeps anyone signed in on this device.
export function useSignOut() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)

  return useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      logger.warn('Backend logout failed; signing out locally', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      })
    }
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])
}
