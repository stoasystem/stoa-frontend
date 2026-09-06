import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { markLoginAuthenticated } from '@/lib/loginTiming'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      markLoginAuthenticated(data.user.role)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success(t('login.signedIn'))
      // 登录时就切语言，避免等 /auth/me 才切换造成闪烁
      const locale = resolveUserLanguage(data.user)
      if (locale && i18n.language !== locale) {
        void i18n.changeLanguage(locale)
      }
      const from = location.state?.from?.pathname
      const search = location.state?.from?.search ?? ''
      const queryNext = new URLSearchParams(location.search).get('next')
      const nextPath = getLoginRedirectPath({
        role: data.user.role,
        queryNext,
        from,
        search,
      })
      // ChatPage waits on this query before it counts as usable (BUG-008);
      // firing it here overlaps that round trip with the route transition
      // instead of waiting for the page to mount first.
      if (data.user.role === 'student') {
        void queryClient.prefetchQuery({
          queryKey: chatQueryKeys.conversations(),
          queryFn: getConversations,
        })
      }
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
