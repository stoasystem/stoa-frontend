import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CHANGE_PASSWORD_PATH } from '@/lib/authRoutes'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const mustChangePassword = useAuthStore((state) => state.user?.mustChangePassword ?? false)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // An account an administrator has reset can sign in and reach nothing else:
  // the backend answers 403 everywhere but the password change. Sending it there
  // is the only screen it can use, and the only way out of the reset.
  if (mustChangePassword && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  return <Outlet />
}
