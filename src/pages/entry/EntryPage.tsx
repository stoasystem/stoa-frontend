/**
 * The front door of the app domain.
 *
 * Someone who is signed in goes straight to their own part of the platform;
 * this is a place people come back to daily, and a returning student should
 * not have to find a way past a page selling them what they already have.
 * Everyone else is asked to sign in. What STOA is lives on the marketing site.
 *
 * This is also the only place that moves someone off the login screen once
 * they are signed in, so a `?next=` link or the page they were sent away from
 * is honoured here; a second navigation from the login mutation would race
 * this one, and the later of the two would win.
 */
import { Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/login/LoginPage'
import { getPostLoginPath } from '@/lib/authRoutes'
import { useAuthStore } from '@/store/authStore'

export function EntryPage() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (isAuthenticated && user?.role) {
    return <Navigate replace to={getPostLoginPath(user, location)} />
  }

  return <LoginPage />
}
