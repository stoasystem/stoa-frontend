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
 * offers "Reload page" instead.
 *
 * Only a new document brings a failed page in: Chromium keeps a failed import
 * for the rest of the document and answers it again without asking the
 * network (#447), so a page that loads again in place fails again.
 *
 * Only a page asks for the reload (`lazyPage.ts`). Every other module the
 * running app loads on demand is optional, and its caller copes with the
 * failure itself: KaTeX's leaves the formula as written, a language's copy
 * reads in English (#414). (The start-up imports
 * in `main.tsx` come before this listener and have a failure screen of their
 * own.) Reloading for it threw away what lives only in
 * memory -- the lesson's place, a quiz, an Ask draft -- and offline it landed
 * on the browser's offline page instead (#401). For the same reason a page
 * reloads the tab only while the reader is still at the address it was asked
 * for, and only online (#447).
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

/** What Vite's preload helper rejects with when a page's stylesheet fails. */
const STYLESHEET_FAILURE = /^Unable to preload CSS for (\S+)$/

type ReloadTarget = Pick<Window, 'addEventListener' | 'removeEventListener' | 'sessionStorage'> & {
  location: Pick<Location, 'reload' | 'pathname'>
  /** Time since this document began, if it can be read. */
  performance?: Pick<Performance, 'now'>
  /** Whether the browser is online, if it can tell. */
  navigator?: Pick<Navigator, 'onLine'>
}

type Listening = {
  target: ReloadTarget
  now: () => number
  /**
   * The modules and stylesheets that failed to load: the errors Vite
   * announced, and a stylesheet of ours that failed again. What a reload may cure.
   */
  loadFailures: WeakSet<object>
  /** Stylesheets Vite could not load, by address, with the load that is bringing each back. */
  deadStylesheets: Map<string, Promise<void> | null>
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
  const current: Listening = { target, now, loadFailures: new WeakSet(), deadStylesheets: new Map() }
  const onPreloadError = (event: Event) => {
    // Never prevented: Vite then rejects the import as usual, and whoever
    // asked for the module decides what its failure means.
    const { payload } = event as Event & { payload?: unknown }
    if (typeof payload !== 'object' || payload === null) return
    current.loadFailures.add(payload)
    const stylesheet = payload instanceof Error ? STYLESHEET_FAILURE.exec(payload.message)?.[1] : undefined
    if (stylesheet !== undefined && !current.deadStylesheets.has(stylesheet)) {
      current.deadStylesheets.set(stylesheet, null)
    }
  }
  listening = current
  target.addEventListener('vite:preloadError', onPreloadError)
  return () => {
    target.removeEventListener('vite:preloadError', onPreloadError)
    if (listening === current) listening = null
  }
}

/**
 * Whether `error` is a module or stylesheet that failed to load. In this
 * document it would only fail again, so the way back is a reload (#447).
 */
export function isLoadFailure(error: unknown): boolean {
  return listening !== null && typeof error === 'object' && error !== null && listening.loadFailures.has(error)
}

/** What became of a page whose module failed to load. */
export type FailedPageOutcome =
  /** The tab is reloading; the page waits for it. */
  | 'reloading'
  /** The reader is at another address now; nothing reloads, and the page loads afresh when it is next shown. */
  | 'left'
  /** The page shows its error. */
  | 'failed'

/**
 * Reloads the tab for a page whose module failed to load, if that may cure it.
 *
 * `askedAt` is the address (`location.pathname`) at which the page was asked
 * for. A page that failed after the reader went somewhere else reloads
 * nothing: the reload would throw away the page they are on now (#447). While
 * the browser is offline the page waits for it to come back, and is judged
 * then: reloaded offline, the tab only showed the browser's offline page.
 *
 * An error Vite did not announce (the dev server, a test) is left to the page's
 * error boundary, and so is one that is our own reload's failure again.
 */
export async function reloadForFailedPage(error: unknown, askedAt?: string): Promise<FailedPageOutcome> {
  const current = listening
  if (current === null || !isLoadFailure(error)) return 'failed'
  const { target, now } = current
  for (;;) {
    if (withinOurReload(target, now())) return 'failed'
    if (askedAt !== undefined && target.location.pathname !== askedAt) return 'left'
    if (target.navigator?.onLine !== false) break
    await nextOnline(target)
    if (listening !== current) return 'failed'
  }
  const at = now()
  // Without a record of this reload the next failure could not tell it was
  // the same one, so with blocked storage nothing reloads at all.
  if (!rememberReload(target, at)) return 'failed'
  target.location.reload()
  return 'reloading'
}

function nextOnline(target: ReloadTarget): Promise<void> {
  return new Promise((resolve) => target.addEventListener('online', () => resolve(), { once: true }))
}

/**
 * Whether `at` falls in our last reload's window: moments after it, or in the
 * document it made (CHUNK_RELOAD_WINDOW_MS).
 */
function withinOurReload(target: ReloadTarget, at: number): boolean {
  const previous = lastReload(target)
  if (previous === null) return false
  // When this document began, on the same clock as the reload's record.
  // Not `performance.timeOrigin`: Firefox's source works that out from a
  // clock fixed once per process, which can fall behind `Date.now()` -- by
  // hours, once the computer has slept.
  const began = at - (target.performance?.now() ?? NaN)
  const sinceReload = at - previous
  if (sinceReload >= 0 && sinceReload < CHUNK_RELOAD_WINDOW_MS) return true
  return began - previous >= -CLOCK_SLACK_MS && began - previous < CHUNK_RELOAD_WINDOW_MS
}

/**
 * Whether this tab reloaded for a failed page moments ago, or is the document
 * that reload made. A page is then not loaded ahead of time (#441 audit): the
 * network that failed may not be back yet, and a browser keeps a module that
 * failed for the rest of the document, so an early load could spend the
 * page's one chance. Its own load, when it renders, comes as late as before.
 */
export function justReloadedForFailedPage(): boolean {
  if (listening !== null) return withinOurReload(listening.target, listening.now())
  return typeof window !== 'undefined' && withinOurReload(window, Date.now())
}

/**
 * Brings back the stylesheets Vite could not load in this document; resolves
 * once each is in, and rejects, with a load failure, if one fails again.
 *
 * Vite asks for a stylesheet only the first time a page needs it in a
 * document. After a failure the next page that shares it -- the map, a
 * subject's map and Ask share one; a chapter and its lessons another --
 * loaded without it and was shown unstyled, with nothing reported (#447). So
 * before a page is shown, each dead `<link>` is replaced by a new one for the
 * same address, and the page waits for it. Every page waits, not only those
 * that need the stylesheet: which page needs which is known only to the build.
 */
export function restoreFailedStylesheets(): Promise<void> {
  const current = listening
  if (current === null || current.deadStylesheets.size === 0) return Promise.resolve()
  return Promise.all([...current.deadStylesheets.keys()].map((href) => restoreStylesheet(current, href))).then(
    () => undefined,
  )
}

function restoreStylesheet(current: Listening, href: string): Promise<void> {
  const pending = current.deadStylesheets.get(href)
  if (pending) return pending
  const restored = new Promise<void>((resolve, reject) => {
    const fresh = document.createElement('link')
    fresh.rel = 'stylesheet'
    // As Vite's own <link>, so the request is the same.
    fresh.crossOrigin = ''
    fresh.href = href
    fresh.addEventListener('load', () => {
      current.deadStylesheets.delete(href)
      resolve()
    })
    fresh.addEventListener('error', () => {
      // Dead again; the next page asks again.
      current.deadStylesheets.set(href, null)
      const error = new Error(`Unable to load the stylesheet ${href} again`)
      current.loadFailures.add(error)
      reject(error)
    })
    const dead = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].find(
      (link) => link.getAttribute('href') === href,
    )
    // In the dead one's place, so the stylesheets keep the order Vite gave them.
    if (dead) dead.replaceWith(fresh)
    else document.head.append(fresh)
  })
  current.deadStylesheets.set(href, restored)
  return restored
}
