import { useEffect } from 'react'
import { useCurrentUserQuery } from '@/hooks/auth/useCurrentUserQuery'
import { listenForBrowserSignInChanges } from '@/services/auth/browserSignInChanges'
import { useAuthStore } from '@/store/authStore'

export function AuthBootstrap() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  useCurrentUserQuery()

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  // Another tab signing out, or signing in as someone, signs this tab out (#320).
  useEffect(() => listenForBrowserSignInChanges(), [])

  return null
}
