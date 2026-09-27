import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clearUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import { forgetSessionHolding, tabToken } from '@/lib/devSessions'
import { logout, type LogoutOutcome } from '@/services/auth/authApi'
import { logger } from '@/services/logging/logger'
import { TOKEN_KEY, trackPendingLogout, useAuthStore } from '@/store/authStore'

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

// The one way a person signs out, so every account menu revokes the session the
// same way (stoasystem/stoa-frontend#19).
//
// This device is cleared first and the backend told afterwards, without waiting
// for it: a backend that hangs must not leave the token in storage for as long
// as it hangs, or for good if the tab is closed meanwhile. The token the backend
// revokes is read before anything is cleared - the pinned tab's own if it holds
// one, otherwise the shared one, the same precedence every request uses - and
// handed to the call, which is sent once and never retried.
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

    const accessToken = tabToken() ?? localStorage.getItem(TOKEN_KEY)

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
    if (accessToken) forgetSessionHolding(accessToken)
    // Register before navigation unmounts this menu. The login mutation waits
    // for completion or the request's 8 s timeout; server work may outlive it.
    const pending = trackPendingLogout(
      accessToken ? logout(accessToken).then(logOutcome) : Promise.resolve(),
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
