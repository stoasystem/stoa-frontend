/**
 * The front door of the app domain.
 *
 * Someone who is signed in goes straight to their own part of the platform;
 * this is a place people come back to daily, and a returning student should
 * not have to find a way past a page selling them what they already have.
 * Everyone else is asked to sign in. What STOA is lives on the marketing site.
 */
import { Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/login/LoginPage'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { useAuthStore } from '@/store/authStore'

export function EntryPage() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && user?.role) {
    return <Navigate replace to={getDefaultRouteForRole(user.role)} />
  }

  return <LoginPage />
}
