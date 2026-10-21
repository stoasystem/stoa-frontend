/*
 * Reloading once when a page's module fails to load (#272).
 *
 * In a build, Vite announces every failed dynamic import with
 * `vite:preloadError` -- a module that could not be fetched, its stylesheet,
 * or a module that threw as it ran -- then rejects the import with the same
 * error. The dev server has no such announcement. A reload fetches the page
 * afresh, which recovers both a moment's network loss and a page that is still
 * running an older release. If the same failure comes back right after a
 * reload, reloading again would only loop: the page's error boundary then
 * offers "Try again" and "Reload page" instead.
 *
 * Only a page asks for the reload (`lazyPage.ts`). Every other module the
 * running app loads on demand is optional, and its caller copes with the
 * failure itself: KaTeX's leaves the formula as written. (The start-up imports
 * in `main.tsx` come before this listener and have a failure screen of their
 * own.) Reloading for it threw away what lives only in
 * memory -- the lesson's place, a quiz, an Ask draft -- and offline it landed
 * on the browser's offline page instead (#401).
 *
 * The time of the last reload is kept in this tab's sessionStorage. It names
 * nobody, so it is not an account's: a sign-out or an account switch clears it
 * with everything else, which at worst allows one more reload.
 */
export const CHUNK_RELOAD_KEY = 'stoa_chunk_reload_at'

/**
 * A failure this soon after our own reload is the same one again, and so is a
 * failure in a document that began this soon after it: the document the
 * reload made, judged by when it began rather than when its page failed.
 * Counted only from the reload, a page whose module hung past the window
 * before it failed reloaded the tab again and again, and never showed its
 * error (#401 audit).
 */
export const CHUNK_RELOAD_WINDOW_MS = 30_000

/**
 * How far before our reload the document it made may seem to have begun.
 * Worked out as `Date.now() - performance.now()`, the start comes out up to a
 * millisecond or so early in Chromium; a clock set back a little does the same.
 */
const CLOCK_SLACK_MS = 1_000

type ReloadTarget = Pick<Window, 'addEventListener' | 'removeEventListener' | 'sessionStorage'> & {
  location: Pick<Location, 'reload'>
  /** Time since this document began, if it can be read. */
  performance?: Pick<Performance, 'now'>
}

type Listening = {
  target: ReloadTarget
  now: () => number
  /** The errors Vite announced: what makes a page's failure one a reload may cure. */
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
 * An error Vite did not announce (the dev server, a test) is left to the page's
 * error boundary, and so is one that is our own reload's failure again.
 */
export function reloadForFailedPage(error: unknown): boolean {
  if (listening === null || typeof error !== 'object' || error === null) return false
  const { target, now, announced } = listening
  if (!announced.has(error)) return false
  const at = now()
  const previous = lastReload(target)
  if (previous !== null) {
    // When this document began, on the same clock as the reload's record.
    // Not `performance.timeOrigin`: Firefox's source works that out from a
    // clock fixed once per process, which can fall behind `Date.now()` -- by
    // hours, once the computer has slept.
    const began = at - (target.performance?.now() ?? NaN)
    const sinceReload = at - previous
    if (sinceReload >= 0 && sinceReload < CHUNK_RELOAD_WINDOW_MS) return false
    if (began - previous >= -CLOCK_SLACK_MS && began - previous < CHUNK_RELOAD_WINDOW_MS) return false
  }
  // Without a record of this reload the next failure could not tell it was
  // the same one, so with blocked storage nothing reloads at all.
  if (!rememberReload(target, at)) return false
  target.location.reload()
  return true
}
