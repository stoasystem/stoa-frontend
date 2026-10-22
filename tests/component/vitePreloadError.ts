/*
 * What a built bundle does when a dynamic import fails, for tests that run
 * without it: Vitest does not wrap `import()` in Vite's preload helper.
 *
 * The helper (`handlePreloadError`, Vite 6) dispatches `vite:preloadError` on
 * `window` with the error as its `payload`, then rejects the import with that
 * same error -- unless a listener prevented the event, when the import
 * resolves to nothing instead.
 */
import { vi } from 'vitest'

export function chunkError(chunk = 'Page-abc123') {
  return new TypeError(`Failed to fetch dynamically imported module: /assets/${chunk}.js`)
}

export function failLikeVite(error: Error, target: EventTarget = window): Promise<undefined> {
  const event = Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: error })
  target.dispatchEvent(event)
  return event.defaultPrevented ? Promise.resolve(undefined) : Promise.reject(error)
}

/**
 * The window as `installChunkReload` sees it, hearing what is dispatched on
 * the real one, with a reload that only counts. jsdom cannot navigate. Its
 * address and whether it is online are the real window's, so a test moves the
 * reader with `history.pushState` and takes them offline with
 * `goOffline` (below).
 */
export function listeningWindow() {
  const reload = vi.fn()
  const target = {
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
    sessionStorage: window.sessionStorage,
    navigator: window.navigator,
    location: {
      reload,
      get pathname() {
        return window.location.pathname
      },
    },
  } as unknown as Window
  return { target, reload }
}

/** Takes jsdom's window offline; returns a function that brings it back, with the browser's `online` event. */
export function goOffline() {
  const onLine = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
  return () => {
    onLine.mockReturnValue(true)
    window.dispatchEvent(new Event('online'))
  }
}
