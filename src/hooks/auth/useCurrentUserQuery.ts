import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/services/auth/authApi'
import { useAuthStore } from '@/store/authStore'

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((state) => state.accessToken)
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  return query
}
