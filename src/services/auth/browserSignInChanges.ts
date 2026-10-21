/*
 * One account per browser (#320, docs/adr/0003): when another tab signs out,
 * or signs in as someone, every tab still on the previous sign-in signs itself
 * out at once. Its sign-in page then says whose session ended, or who is
 * signed in now, and offers to continue as them.
 *
 * Another tab can only sign this one out: nothing it writes puts this tab on
 * an account while it shows another. The same check runs before each request,
 * for a tab that missed the event (asleep, or frozen by the browser).
 */
import { queryClient } from '@/app/query/queryClient'
import { isBrowserSignInEvent, returnToHere, tabOnBrowserSignIn } from '@/lib/tabAccount'
import { useAuthStore } from '@/store/authStore'

/**
 * Sign this tab out if the browser's sign-in is no longer the one it holds.
 * True when it did: the caller must not send anything as the old account.
 */
export function signOutIfReplacedElsewhere(): boolean {
  if (tabOnBrowserSignIn()) return false
  useAuthStore.getState().clearAuth({ reason: 'signed-out-elsewhere', ...returnToHere() })
  queryClient.clear()
  // A full load, even on the sign-in page: it then says what happened.
  window.location.assign('/login')
  return true
}

export function listenForBrowserSignInChanges(): () => void {
  const onStorage = (event: StorageEvent) => {
    if (isBrowserSignInEvent(event)) signOutIfReplacedElsewhere()
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
