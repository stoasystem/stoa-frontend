import { apiBaseUrl } from '@/lib/env'

/*
 * Wake the backend while the visitor is still typing (#601).
 *
 * A cold Lambda container spends 4-5 s importing before it answers anything
 * (stoa-backend#306: 14 days, 100 cold starts, Init Duration p50 4.09 s, p90
 * 5.10 s). The sign-in page asks the backend nothing of its own, so the first
 * request to reach it was the sign-in: the browser's CORS preflight landed on
 * the cold container and waited out the start for `POST /auth/login`. A cold
 * sign-in took about 7.7 s to the first screen, a warm one 0.9 s. Typing an
 * email and a password takes longer than the start, so the page now asks for
 * `GET /health` as it opens, and the start happens behind the typing.
 *
 * The request is a CORS "simple request": GET, no header of our own, no
 * credentials. So the browser sends it straight away, without a preflight of
 * its own to wait on, and nothing about the visitor goes with it. `/health` is
 * public and answers `{"status": "ok"}`. Nobody reads the answer: a refusal, a
 * timeout or no network at all changes nothing, and it is not retried.
 *
 * Once per tab in PREWARM_INTERVAL_MS: coming back to the sign-in page from
 * another one, or opening it twice (React's StrictMode mounts it twice in
 * development), does not ask again. The time is kept in the tab's session
 * store, so a reload inside the window does not ask again either, and in
 * memory as well, for a tab whose store is blocked.
 *
 * Not on the dev server: there the design preview answers the API from its own
 * handlers, and a developer's backend is warm or local anyway. Every build
 * sends it, production and preview alike.
 */

/** How long one wake-up counts for in a tab. Lambda keeps an idle container for minutes, not hours. */
export const PREWARM_INTERVAL_MS = 5 * 60 * 1000

export const PREWARM_SENT_AT_KEY = 'stoa:backend-prewarm-sent-at'

let sentAtInMemory: number | null = null

function lastSentAt(): number | null {
  try {
    const stored = sessionStorage.getItem(PREWARM_SENT_AT_KEY)
    if (stored !== null) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed)) return parsed
    }
  } catch {
    // A blocked session store falls back to memory.
  }
  return sentAtInMemory
}

function rememberSentAt(now: number) {
  sentAtInMemory = now
  try {
    sessionStorage.setItem(PREWARM_SENT_AT_KEY, String(now))
  } catch {
    // Memory alone still keeps this tab from asking twice while it stays open.
  }
}

/**
 * Ask the backend for `/health` unless this tab did so within the interval.
 * Returns whether it asked. Never throws, never waits.
 */
export function prewarmBackend(now: number = Date.now()): boolean {
  if (import.meta.env.DEV) return false
  const sentAt = lastSentAt()
  if (sentAt !== null && now >= sentAt && now - sentAt < PREWARM_INTERVAL_MS) return false
  rememberSentAt(now)
  try {
    // No headers, no credentials: a simple request, so no preflight.
    void fetch(`${apiBaseUrl}/health`, { credentials: 'omit', cache: 'no-store' }).catch(() => {
      // The wake-up is best effort; the sign-in does not depend on it.
    })
  } catch {
    // A fetch that throws before it starts (no fetch at all) is as silent.
  }
  return true
}
