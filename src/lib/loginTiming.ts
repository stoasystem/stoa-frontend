/**
 * Time the wait between pressing Sign in and having a page to use.
 *
 * Measured at about 3.9s to first usable screen, with no way to tell which
 * stage owned it. Three marks split the wait into the parts that can be
 * optimised separately: the credential exchange, and everything the landing
 * route does before it is usable.
 */
import { trackEvent } from '@/services/analytics/analyticsClient'

const SUBMITTED_AT_KEY = 'stoa.login.submittedAt'

function readSubmittedAt(): number | null {
  try {
    const stored = sessionStorage.getItem(SUBMITTED_AT_KEY)
    if (!stored) return null
    const parsed = Number(stored)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}

function elapsed(): number | null {
  const submittedAt = readSubmittedAt()
  return submittedAt === null ? null : Math.round(Date.now() - submittedAt)
}

function clear() {
  try {
    sessionStorage.removeItem(SUBMITTED_AT_KEY)
  } catch {
    // A blocked session store only costs the measurement.
  }
}

/** The student pressed Sign in. Starts the clock. */
export function markLoginSubmitted() {
  try {
    sessionStorage.setItem(SUBMITTED_AT_KEY, String(Date.now()))
  } catch {
    // Timing is best effort; never let it break the sign-in.
  }
  trackEvent('login_submitted', {})
}

/** Credentials were exchanged and the session was written. */
export function markLoginAuthenticated(role: string) {
  const ms = elapsed()
  if (ms === null) return
  trackEvent('login_authenticated', { role, msSinceSubmit: ms })
}

/** The landing route has its first screen of real content. Stops the clock. */
export function markLoginFirstScreenReady(route: string) {
  const ms = elapsed()
  if (ms === null) return
  clear()
  trackEvent('login_first_screen_ready', { route, msSinceSubmit: ms })
}
