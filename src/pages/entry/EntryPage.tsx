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
 * One account per browser (#320, docs/adr/0003). A tab that has no account
 * while the browser is signed in - opened here, signed out with the others,
 * or signed in elsewhere since - joins the browser's account and goes in,
 * unless that would put a different person where this tab last showed
 * somebody: then it says who is signed in now and waits to be told to
 * continue as them. A tab whose session ended without the reader signing out
 * says whose it was and offers that account again (#217). Signing in again as
 * that same account goes back to the page the tab was on; signing in as
 * anyone else goes to that account's home.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AccountLoadStatus } from '@/app/router/AccountLoadStatus'
import { LoginPage } from '@/pages/login/LoginPage'
import { getPostLoginTarget, getReturnTarget } from '@/lib/authRoutes'
import {
  browserSignInSnapshot,
  isSameAccount,
  joinBrowserSignIn,
  parseBrowserSignIn,
  readTabSignOut,
  subscribeBrowserSignIn,
} from '@/lib/tabAccount'
import { useAuthStore } from '@/store/authStore'

export function EntryPage() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  // Read once, as the page opens: signing in or joining clears it.
  const [ended] = useState(() => readTabSignOut())
  const [choseOther, setChoseOther] = useState(false)
  const signInOther = useCallback(() => setChoseOther(true), [])
  const browser = parseBrowserSignIn(useSyncExternalStore(subscribeBrowserSignIn, browserSignInSnapshot, () => null))

  // Whether joining the browser's account would show this tab a different
  // person than the one it last showed: then only on being told to.
  const named = ended && ended.reason !== 'signed-out' ? ended.account : undefined
  const otherPerson = Boolean(browser && named && !(browser.account && isSameAccount(browser.account, named)))
  const joinNow = !isAuthenticated && browser !== null && !otherPerson && !choseOther

  // Only the sign-in this render decided on: one another tab put there since
  // gets its own render, and its own decision (#320 audit F3).
  const browserId = browser?.id
  const join = useCallback(() => {
    if (!browserId || !joinBrowserSignIn(browserId)) return
    useAuthStore.getState().hydrateFromStorage()
  }, [browserId])
  useEffect(() => {
    if (joinNow) join()
  }, [joinNow, join])

  if (isAuthenticated && user?.role) {
    // A reset account goes to the password change first, carrying where it
    // was going (#412).
    if (ended && ended.reason !== 'signed-out') {
      const back = !choseOther && isSameAccount(user, ended.account)
      const target = getReturnTarget(user, back ? ended.returnTo : undefined)
      return <Navigate replace to={target.to} state={target.state} />
    }
    const target = getPostLoginTarget(user, location)
    return <Navigate replace to={target.to} state={target.state} />
  }

  // Signed in, the account still being read (or its read failed): the
  // sign-in form has nothing to do here, and signing in from it would replace
  // the browser's sign-in (#343). Joined or opened while signed in alike.
  if (isAuthenticated && !user) return <AccountLoadStatus />

  if (!isAuthenticated && browser?.account && named && otherPerson && !choseOther) {
    return (
      <LoginPage
        mode={{ kind: 'switched', account: browser.account, previous: named, onContinue: join, onSignInOther: signInOther }}
      />
    )
  }
  if (ended && ended.reason !== 'signed-out' && ended.account && !choseOther) {
    return (
      <LoginPage mode={{ kind: 'reauth', reason: ended.reason, account: ended.account, onSignInOther: signInOther }} />
    )
  }
  return <LoginPage />
}
