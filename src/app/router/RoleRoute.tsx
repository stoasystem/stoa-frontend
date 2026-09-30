import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { FORBIDDEN_PATH } from '@/app/router/routeManifest'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

export function RoleRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!user) {
    if (accessToken) {
      return (
        <div role="status" className="flex min-h-screen items-center justify-center bg-ground text-sm text-caption">
          {t('status.loadingAccount')}
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
