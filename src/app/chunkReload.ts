/*
 * Reloading once when a page's module cannot be fetched (#272).
 *
 * Vite announces a failed dynamic import with `vite:preloadError`, then rejects
 * the import with the same error. A reload fetches the page afresh, which
 * recovers both a moment's network loss and a page that is still running an
 * older release. If the same failure comes back right after a reload,
 * reloading again would only loop: the page's error boundary then offers
 * "Try again" instead.
 *
 * Only a page asks for the reload (`lazyPage.ts`). Every other module loaded on
 * demand is optional, and its caller copes with the failure itself: KaTeX's
 * leaves the formula as written. Reloading for it threw away what lives only in
 * memory -- the lesson's place, a quiz, an Ask draft -- and offline it landed
 * on the browser's offline page instead (#401).
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

type Listening = {
  target: ReloadTarget
  now: () => number
  /** The errors Vite announced, so a page can tell a failed fetch from any other. */
  announced: WeakSet<object>
}

let listening: Listening | null = null

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
  const current: Listening = { target, now, announced: new WeakSet() }
  const onPreloadError = (event: Event) => {
    // Never prevented: Vite then rejects the import as usual, and whoever
    // asked for the module decides what its failure means.
    const { payload } = event as Event & { payload?: unknown }
    if (typeof payload === 'object' && payload !== null) current.announced.add(payload)
  }
  listening = current
  target.addEventListener('vite:preloadError', onPreloadError)
  return () => {
    target.removeEventListener('vite:preloadError', onPreloadError)
    if (listening === current) listening = null
  }
}

/**
 * Reloads the tab for a page whose module failed to load; `true` when the
 * reload has started and the page should wait for it.
 *
 * An error Vite did not announce is left to the page's error boundary, and so
 * is one that comes back within the window after our own reload.
 */
export function reloadForFailedPage(error: unknown): boolean {
  if (listening === null || typeof error !== 'object' || error === null) return false
  const { target, now, announced } = listening
  if (!announced.has(error)) return false
  const at = now()
  const previous = lastReload(target)
  if (previous !== null && at - previous >= 0 && at - previous < CHUNK_RELOAD_WINDOW_MS) return false
  // Without a record of this reload the next failure could not tell it was
  // the same one, so with blocked storage nothing reloads at all.
  if (!rememberReload(target, at)) return false
  target.location.reload()
  return true
}
