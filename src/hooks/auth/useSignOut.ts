import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clearAskQuote } from '@/features/ask/practiceContext'
import { clearUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import { clearPendingMessages } from '@/lib/pendingChatMessages'
import { forgetTestRolesHolding } from '@/lib/testRoles'
import { rotateAnalyticsSession } from '@/services/analytics/analyticsClient'
import { logout, type LogoutOutcome } from '@/services/auth/authApi'
import { logoutRefused, logoutWithRefreshToken, type RefreshedLogout } from '@/services/auth/revokeSignIn'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { forgetCheckoutOperation } from '@/services/billing/billingApi'
import { logger } from '@/services/logging/logger'
import { resetAsk } from '@/store/askStore'
import { currentSessionToken, trackPendingLogout, useAuthStore } from '@/store/authStore'

function logOutcome(outcome: LogoutOutcome) {
  if (outcome.kind === 'ok') {
    logger.info('Backend logout confirmed', { outcome: 'ok' })
    return
  }
  logger.warn('Backend logout not confirmed; signed out locally', {
    outcome: outcome.kind,
    ...(outcome.kind === 'http' ? { status: outcome.status } : {}),
    ...(outcome.kind === 'network' && outcome.transportCode
      ? { transportCode: outcome.transportCode }
      : {}),
  })
}

function logRefreshedOutcome(refused: LogoutOutcome & { kind: 'http' }, afterRefresh: RefreshedLogout) {
  if (afterRefresh === 'ok') {
    logger.info('Backend logout confirmed', { outcome: 'ok', afterRefresh: true })
    return
  }
  logger.warn('Backend logout not confirmed; signed out locally', {
    outcome: refused.kind,
    status: refused.status,
    afterRefresh,
  })
}

// An access token that ran out while the page sat idle cannot name its sign-in
// to the backend any more: the logout is refused and ends nothing, and the
// refresh token would go on minting new ones for 30 days. Then the refresh
// token is spent once and the fresh token signed out, as for a sign-in the
// browser drops by itself (#399). Never throws.
async function endOnServer(accessToken: string, refreshToken: string | null): Promise<void> {
  const outcome = await logout(accessToken)
  if (outcome.kind === 'http' && logoutRefused(outcome.status) && refreshToken) {
    logRefreshedOutcome(outcome, await logoutWithRefreshToken(refreshToken))
    return
  }
  logOutcome(outcome)
}

// The one way a person signs out, so every account menu revokes the session the
// same way (stoasystem/stoa-frontend#19).
//
// This device is cleared first and the backend told afterwards, without waiting
// for it: a backend that hangs must not leave the token in storage for as long
// as it hangs, or for good if the tab is closed meanwhile. The tokens the
// backend revokes are read before anything is cleared - this tab's copy of the
// browser's sign-in, the one every request uses - and handed to the call, which
// is sent once and never retried; only a refused one is followed by the refresh
// token's sign-out (#399). Clearing ends the browser's sign-in, so every other
// tab signs out with this one (#320).
export function useSignOut() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  // The ref stops a second click in the same tick; the state lets the menu
  // show that it is already happening.
  const runningRef = useRef(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const signOut = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setIsSigningOut(true)

    const accessToken = currentSessionToken()
    const refreshToken = storedRefreshToken()

    clearAuth()
    // Query keys do not name the user, so whoever signs in next on this tab
    // would be served this person's answers. Clearing destroys each query, which
    // also cancels a fetch still in flight, so its answer is dropped rather than
    // written back; a mutation still in flight is stopped by the client's own
    // guard.
    queryClient.clear()
    // Left in the tab, the upload hand-off opens the next student's chat with
    // this person's prompt and attachments already in the composer.
    clearUploadHandoff()
    // Likewise Ask: a half-typed question, the open conversation, and any
    // question still waiting for its answer (#49).
    resetAsk()
    clearPendingMessages()
    clearAskQuote()
    // A checkout started here, and the analytics session, are this person's
    // too (#34).
    forgetCheckoutOperation()
    rotateAnalyticsSession()
    // A test role the switcher held for this sign-in is over too.
    forgetTestRolesHolding({ accessToken, refreshToken })
    // Register before navigation unmounts this menu. The login mutation waits
    // for every request here to finish or time out - the logout's 8 s, and
    // after a refusal the refresh's 10 s and the second logout's 8 s - since a
    // logout landing after the next sign-in would end that one too. Server work
    // may outlive it.
    const pending = trackPendingLogout(
      accessToken ? endOnServer(accessToken, refreshToken) : Promise.resolve(),
    )
    // Replacing the entry keeps Back from reopening the page just left.
    navigate('/login', { replace: true })

    try {
      await pending
    } finally {
      runningRef.current = false
      setIsSigningOut(false)
    }
  }, [clearAuth, navigate, queryClient])

  return { signOut, isSigningOut }
}
