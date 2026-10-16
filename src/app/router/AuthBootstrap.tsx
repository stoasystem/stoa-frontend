import { useEffect } from 'react'
import { useCurrentUserQuery } from '@/hooks/auth/useCurrentUserQuery'
import { listenForSignInsEndedElsewhere } from '@/services/auth/signInEndedElsewhere'
import { useAuthStore } from '@/store/authStore'

export function AuthBootstrap() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  useCurrentUserQuery()

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  // Another tab signing out of this tab's sign-in signs this tab out (#232).
  useEffect(() => listenForSignInsEndedElsewhere(), [])

  return null
}
