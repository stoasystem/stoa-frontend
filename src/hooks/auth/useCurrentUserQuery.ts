import { useEffect, useRef } from 'react'
import { useAccountRead } from '@/hooks/auth/accountRead'
import i18n from '@/i18n'
import { resolveUserLanguage } from '@/i18n/languages'
import { useAuthStore } from '@/store/authStore'

/** Reads this tab's account and stores it, once for the whole app (`AuthBootstrap`). */
export function useCurrentUserQuery() {
  const setUser = useAuthStore((state) => state.setUser)
  // The account whose stored locale was applied: another account joined in
  // this tab (signed out, then the browser's sign-in) has its own (#343).
  const appliedStoredLocaleFor = useRef<string | null>(null)

  const query = useAccountRead()

  useEffect(() => {
    if (!query.data) return
    setUser(query.data)

    // The stored preference is adopted once per account, when it is first read.
    // Re-applying it on every refetch of /auth/me fought the language switcher:
    // the switcher's own preference write invalidates this query, and the read
    // that follows could still carry the previous locale and snap the whole UI
    // back to it a moment after the student changed it.
    if (appliedStoredLocaleFor.current === query.data.id) return
    appliedStoredLocaleFor.current = query.data.id

    const locale = resolveUserLanguage(query.data)
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [query.data, setUser])

  return query
}
