import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { rememberSession } from '@/lib/devSessions'
import { getPostLoginPath } from '@/lib/authRoutes'
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
      // Hold the account that just signed in, so the account menu has
      // something to switch back to. Nothing did this except the developer
      // switcher's own form, which is why 「添加账号」 signed you in and then
      // offered you nothing. The refresh token travels with it: without one
      // the held account is over an hour later, whatever anyone does with it.
      rememberSession({
        email: data.user.email,
        role: data.user.role,
        name: data.user.name,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      markLoginAuthenticated(data.user.role)
      trackEvent('user_login', { role: data.user.role, userId: data.user.id })
      toast.success(t('login.signedIn'))
      // Signing in from 「添加账号」 lands on the new account rather than
      // waiting for the login screen to move: that screen is deliberately not
      // moving while `?add=1` is up. A full load, not a route change, so the
      // account being left behind takes its cached answers with it — the same
      // reason switching to a held account reloads.
      if (new URLSearchParams(window.location.search).get('add') === '1') {
        window.location.assign(getPostLoginPath(data.user, { search: '' }))
        return
      }

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
