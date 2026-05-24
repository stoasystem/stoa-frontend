import { useEffect } from 'react'
import { useCurrentUserQuery } from '@/hooks/auth/useCurrentUserQuery'
import { useAuthStore } from '@/store/authStore'

export function AuthBootstrap() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage)
  useCurrentUserQuery()

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  return null
}
