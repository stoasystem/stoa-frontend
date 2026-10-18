import { Navigate, Outlet } from 'react-router-dom'
import { AccountLoadStatus } from '@/app/router/AccountLoadStatus'
import { FORBIDDEN_PATH } from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!user) {
    // A session whose account is still being read, or could not be (#250).
    if (accessToken) return <AccountLoadStatus />

    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={FORBIDDEN_PATH} replace />
  }

  return <Outlet />
}
