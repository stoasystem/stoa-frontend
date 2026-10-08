/*
 * The accounts this browser is holding a session for, and moving between them.
 *
 * The behaviour was written for the role switcher and is unchanged; what moved
 * is where it lives, so the account menu can offer the same thing without a
 * second copy of it. Switching accounts stopped being a testing aid when it
 * became clear people need it: a parent with two children's accounts beside
 * their own, a teacher who also has a personal account, a shared computer.
 *
 * Nothing here stores a password. What is held is the session the server
 * already issued to an account that signed in on this browser.
 */
import { useCallback, useState } from 'react'
import {
  forgetSession,
  pinTabToSession,
  readSessions,
  rememberSession,
  sessionLiveness,
  type HeldSession,
} from '@/lib/devSessions'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { apiBaseUrl } from '@/lib/env'
import { exchangeRefreshToken, rememberRefreshToken } from '@/services/auth/sessionRefresh'

export type SwitchProblem = 'expired' | 'unreachable' | null

export function useHeldAccounts() {
  const [sessions, setSessions] = useState<HeldSession[]>(() => readSessions())
  const [problem, setProblem] = useState<SwitchProblem>(null)
  const [busy, setBusy] = useState(false)

  const switchTo = useCallback(async (session: HeldSession) => {
    setProblem(null)
    setBusy(true)
    try {
      // A held access token lasts an hour, and a held account is by definition
      // one nobody has used for a while — so by the time anyone switches to it
      // this almost always comes back refused. It used to end there: the
      // account was dropped and the reader told to sign in again, every time,
      // which is what made the switcher feel broken.
      let accessToken = session.accessToken
      const liveness = await sessionLiveness(accessToken, apiBaseUrl)

      // Only a refusal means the session is gone. A check that could not be
      // made keeps it: it cannot be recovered once dropped.
      if (liveness === 'unknown') {
        setProblem('unreachable')
        return
      }
      if (liveness === 'refused') {
        // The account has its own refresh token. An expired access token is
        // what that exists for; the account is only really over when the
        // server refuses the refresh as well.
        const renewed = session.refreshToken
          ? await exchangeRefreshToken(session.refreshToken)
          : ({ status: 'refused' } as const)
        if (renewed.status === 'unreachable') {
          setProblem('unreachable')
          return
        }
        if (renewed.status !== 'renewed') {
          setSessions(forgetSession(session.email))
          setProblem('expired')
          return
        }
        accessToken = renewed.accessToken
        // Keep the account on its new token, so the next switch to it does not
        // spend another round trip discovering the old one is dead.
        setSessions(
          rememberSession({
            ...session,
            accessToken,
            refreshToken: renewed.refreshToken ?? session.refreshToken,
          }),
        )
        session = { ...session, accessToken, refreshToken: renewed.refreshToken ?? session.refreshToken }
      }

      pinTabToSession(accessToken)
      // The held account's own refresh token travels with it, so switching to
      // it does not hand the reader a session that ends in an hour.
      rememberRefreshToken(session.refreshToken)
      // A full load, not a store update: telling the store about the new role
      // while the old role's page is mounted lets that page's guard reject it
      // and land on the forbidden page. The load drops the previous account's
      // answers with the rest of the cache.
      window.location.assign(getDefaultRouteForRole(session.role as never))
    } finally {
      setBusy(false)
    }
  }, [])

  const forget = useCallback((email: string) => {
    setSessions(forgetSession(email))
  }, [])

  return { sessions, problem, busy, switchTo, forget, refresh: () => setSessions(readSessions()) }
}
