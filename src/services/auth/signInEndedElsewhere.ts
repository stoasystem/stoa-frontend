/*
 * Signing out in one tab ends the sign-in, and every other tab of this browser
 * holding that same sign-in signs itself out at once (#232).
 *
 * The server has already ended it: left alone, those tabs would go on showing
 * the account while every request failed, and then call it an expired session.
 * Only the same sign-in counts - the account signed in again elsewhere is a
 * different one and stays - and all another tab can do to this one is sign it
 * out: what it says never puts this tab on any account.
 */
import { queryClient } from '@/app/query/queryClient'
import { signInOf } from '@/lib/signIn'
import { signInEndedBy } from '@/lib/tabAccount'
import { currentSessionToken, useAuthStore } from '@/store/authStore'

export function listenForSignInsEndedElsewhere(): () => void {
  const onStorage = (event: StorageEvent) => {
    const ended = signInEndedBy(event)
    if (!ended) return
    if (signInOf(currentSessionToken()) !== ended) return
    const { pathname, search, hash } = window.location
    useAuthStore.getState().clearAuth({
      reason: 'signed-out-elsewhere',
      ...(pathname !== '/login' ? { returnTo: `${pathname}${search ?? ''}${hash ?? ''}` } : {}),
    })
    queryClient.clear()
    // A full load, even on the sign-in page: it then says whose sign-in ended.
    window.location.assign('/login')
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
