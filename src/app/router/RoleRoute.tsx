import { Navigate, Outlet } from 'react-router-dom'
import { FORBIDDEN_PATH } from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!user) {
    if (accessToken) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading account...
        </div>
      )
    }

    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={FORBIDDEN_PATH} replace />
  }

  return <Outlet />
}
