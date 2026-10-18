/*
 * Reloading once when a piece of the application cannot be fetched (#272).
 *
 * Vite announces a failed dynamic import with `vite:preloadError`. A reload
 * fetches the page afresh, which recovers both a moment's network loss and a
 * page that is still running an older release. If the same failure comes back
 * right after a reload, reloading again would only loop: the event is then let
 * through, and the page's error boundary offers "Try again" instead.
 *
 * The time of the last reload is kept in this tab's sessionStorage. It names
 * nobody, so it is not an account's: a sign-out or an account switch clears it
 * with everything else, which at worst allows one more reload.
 */
export const CHUNK_RELOAD_KEY = 'stoa_chunk_reload_at'

/** A failure this soon after our own reload is the same one again. */
export const CHUNK_RELOAD_WINDOW_MS = 30_000

type ReloadTarget = Pick<Window, 'addEventListener' | 'removeEventListener' | 'sessionStorage'> & {
  location: Pick<Location, 'reload'>
}

function lastReload(target: ReloadTarget): number | null {
  try {
    const raw = target.sessionStorage.getItem(CHUNK_RELOAD_KEY)
    const at = raw === null ? NaN : Number(raw)
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

function rememberReload(target: ReloadTarget, at: number): boolean {
  try {
    target.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(at))
    return true
  } catch {
    return false
  }
}

/** Starts listening; returns a function that stops. */
export function installChunkReload(target: ReloadTarget = window, now: () => number = Date.now) {
  const onPreloadError = (event: Event) => {
    const at = now()
    const previous = lastReload(target)
    if (previous !== null && at - previous >= 0 && at - previous < CHUNK_RELOAD_WINDOW_MS) return
    // Without a record of this reload the next failure could not tell it was
    // the same one, so with blocked storage nothing reloads at all.
    if (!rememberReload(target, at)) return
    event.preventDefault()
    target.location.reload()
  }
  target.addEventListener('vite:preloadError', onPreloadError)
  return () => target.removeEventListener('vite:preloadError', onPreloadError)
}
