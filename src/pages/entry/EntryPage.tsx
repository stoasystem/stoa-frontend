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
 *
 * `?add=1` is the exception, and the account menu's 「添加账号」 is where it
 * comes from: someone who is already signed in is asking to sign in as
 * somebody else. Without it that link went to this page and was bounced
 * straight back, which read as the button doing nothing at all. Leaving is
 * not this page's job in that case — the login itself reloads onto the new
 * account's home, the way switching to a held account does, so the account
 * being left behind takes its cached answers with it.
 *
 * A new tab with several saved accounts is asked which one it is before the
 * sign-in form (#216); a tab whose sign-in ended is not, and neither is
 * `?add=1`, which is there to sign in somebody new.
 *
 * A tab whose session ended without the reader signing out says whose it was
 * and offers that account again (#217). Signing in again as that same account
 * goes back to the page the tab was on; choosing "another account", or
 * signing in as anyone else, goes to that account's home.
 */
import { useCallback, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoginPage } from '@/pages/login/LoginPage'
import { getDefaultRouteForRole, getPostLoginPath, getReturnPath } from '@/lib/authRoutes'
import { isSameAccount, readTabSignOut, tabNeedsAccountChoice } from '@/lib/tabAccount'
import { useAuthStore } from '@/store/authStore'

export function EntryPage() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  const addingAnother = new URLSearchParams(location.search).get('add') === '1'
  const [choosing, setChoosing] = useState(() => !addingAnother && tabNeedsAccountChoice())
  // Read once, as the page opens: signing in clears it.
  const [ended] = useState(() => readTabSignOut())
  const [choseOther, setChoseOther] = useState(false)
  const signInOther = useCallback(() => {
    setChoosing(false)
    setChoseOther(true)
  }, [])

  if (isAuthenticated && user?.role && !addingAnother) {
    if (ended && ended.reason !== 'signed-out') {
      const back = !choseOther && isSameAccount(user, ended.account)
      const to = back
        ? getReturnPath(user, ended.returnTo)
        : user.mustChangePassword
          ? getReturnPath(user, undefined)
          : getDefaultRouteForRole(user.role)
      return <Navigate replace to={to} />
    }
    return <Navigate replace to={getPostLoginPath(user, location)} />
  }

  if (choosing) return <LoginPage mode={{ kind: 'choose', onSignInOther: signInOther }} />
  if (ended && ended.reason !== 'signed-out' && ended.account && !choseOther && !addingAnother) {
    return (
      <LoginPage mode={{ kind: 'reauth', reason: ended.reason, account: ended.account, onSignInOther: signInOther }} />
    )
  }
  return <LoginPage />
}
