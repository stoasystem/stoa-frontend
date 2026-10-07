import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { markLoginAuthenticated } from '@/lib/loginTiming'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { isEmailVerificationRequiredError, login, type LoginRequest } from '@/services/auth/authApi'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useAuthStore, waitForPendingLogout } from '@/store/authStore'

export function useLoginMutation() {
  const { t } = useTranslation('auth')
  const setAuth = useAuthStore((state) => state.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      await waitForPendingLogout()
      return login(payload)
    },
    onSuccess: async (data) => {
      // 先切语言再写入登录态：登录态一写入，EntryPage 就会跳走，
      // 避免路由已经渲染但语言还没切换完成的闪烁
      const locale = resolveUserLanguage(data.user)
      if (locale && i18n.language !== locale) {
        await i18n.changeLanguage(locale)
      }
      // Signing in is all this does. The login screen (EntryPage) sees the
      // session and picks the destination: the password change for a reset
      // account, else a permitted `?next=` or `from`, else the role's home.
      setAuth(data.user, data.accessToken, data.refreshToken)
      markLoginAuthenticated(data.user.role)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success(t('login.signedIn'))
      // ChatPage waits on this query before it counts as usable (BUG-008);
      // firing it here overlaps that round trip with the route transition
      // instead of waiting for the page to mount first. An account under a
      // forced password change skips it: it would only be refused.
      if (data.user.role === 'student' && !data.user.mustChangePassword) {
        void queryClient.prefetchQuery({
          queryKey: chatQueryKeys.conversations(),
          queryFn: getConversations,
        })
      }
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
