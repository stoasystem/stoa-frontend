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
  sessionLiveness,
  type HeldSession,
} from '@/lib/devSessions'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { apiBaseUrl } from '@/lib/env'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'

export type SwitchProblem = 'expired' | 'unreachable' | null

export function useHeldAccounts() {
  const [sessions, setSessions] = useState<HeldSession[]>(() => readSessions())
  const [problem, setProblem] = useState<SwitchProblem>(null)
  const [busy, setBusy] = useState(false)

  const switchTo = useCallback(async (session: HeldSession) => {
    setProblem(null)
    setBusy(true)
    try {
      // A held access token lasts an hour. One that has gone stale would reach
      // the 401 handler, and before the refresh token existed that signed the
      // whole browser out — so it is still checked before this tab adopts it.
      const liveness = await sessionLiveness(session.accessToken, apiBaseUrl)
      if (liveness === 'refused') {
        setSessions(forgetSession(session.email))
        setProblem('expired')
        return
      }
      // Only a refusal means the session is gone. A check that could not be
      // made keeps it: it cannot be recovered once dropped.
      if (liveness === 'unknown') {
        setProblem('unreachable')
        return
      }
      pinTabToSession(session.accessToken)
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
