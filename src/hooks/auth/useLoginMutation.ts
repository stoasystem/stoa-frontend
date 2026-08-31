import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { markLoginAuthenticated } from '@/lib/loginTiming'
import { isEmailVerificationRequiredError, login, type LoginRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

const roleNextPathPrefixes: Record<UserRole, string[]> = {
  student: ['/chat', '/learn', '/profile'],
  parent: ['/parent', '/billing', '/support'],
  teacher: ['/tutor', '/support', '/teacher-activate'],
  admin: ['/admin'],
  organization_admin: ['/organization'],
  school_teacher: ['/organization'],
  school_viewer: ['/organization'],
}

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function canUseNextPathForRole(path: string, role: UserRole) {
  return roleNextPathPrefixes[role].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

function getLoginRedirectPath({
  role,
  queryNext,
  from,
  search,
}: {
  role: UserRole
  queryNext: string | null
  from: unknown
  search: string
}) {
  const defaultRoute = getDefaultRouteForRole(role)

  if (isSafePath(queryNext) && canUseNextPathForRole(queryNext, role)) {
    return queryNext
  }

  if (isSafePath(from) && canUseNextPathForRole(from, role)) {
    return `${from}${search}`
  }

  return defaultRoute
}

export function useLoginMutation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('auth')
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      markLoginAuthenticated(data.user.role)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success(t('login.signedIn'))
      const from = location.state?.from?.pathname
      const search = location.state?.from?.search ?? ''
      const queryNext = new URLSearchParams(location.search).get('next')
      const nextPath = getLoginRedirectPath({
        role: data.user.role,
        queryNext,
        from,
        search,
      })
      navigate(nextPath)
    },
    onError: (error) => {
      toast.error(
        isEmailVerificationRequiredError(error)
          ? t('login.verifyFirst')
          : t('login.failed'),
      )
    },
  })
}
