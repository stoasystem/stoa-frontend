/*
 * The design preview's protection for the other dev pages that sign in a fake
 * account: the star map bench (`starmap.html`) and the component gallery
 * (`components.html`) (#135, #126 audit F6).
 *
 * Like the preview (`main.tsx`), they run on the dev server's origin, which
 * the real dev app shares. Without this, a token left in that origin's
 * `localStorage` by `npm run dev` would be read by `httpClient` and sent to
 * the API origin with every request the page makes. After `takePageOffline()`:
 *
 * - `localStorage` / `sessionStorage` are this page's own, in memory and empty
 *   (`storage.ts`), so the real ones are neither read nor written;
 * - the runtime config points at `API_ORIGIN`, a name that cannot resolve;
 * - axios, `fetch` and WebSocket are answered by the preview's demo handlers
 *   or 404 quietly (`interception.ts`); only the dev server's own files and
 *   its hot reload go through.
 *
 * Only this module and `storage.ts` (which imports nothing) load before the
 * storage is replaced; the interception layer and its demo backend are
 * imported after it, and the page's own app modules after this resolves.
 * Await it before importing anything of the app.
 */
import { isolateStorage } from '@/dev/preview/storage'

export async function takePageOffline() {
  isolateStorage()
  const [{ API_ORIGIN, installInterception }, { registerDevelopmentRuntimeConfig }] = await Promise.all([
    import('@/dev/preview/interception'),
    import('@/lib/runtimeConfig'),
  ])
  registerDevelopmentRuntimeConfig(API_ORIGIN, window.location.origin)
  await installInterception()
}
