import { createElement, lazy, type ComponentType } from 'react'
import { reloadForFailedPage } from '@/app/chunkReload'

/* The props a page receives from the route manifest: whatever its entry lists
 * under `props`, plus the entry's `titleKey` when it has one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pages differ in props; the manifest supplies them
export type PageComponent = ComponentType<any>

export type LazyPage = PageComponent & {
  /** The named export the page is loaded from, e.g. `TeacherDashboardPage`. */
  readonly pageName: string
  /**
   * Starts loading the page's module before the page is rendered (#415). A
   * page that mounts once its module is in renders at once. The page's render
   * takes over this load, failure included: the preload reports nothing and
   * reloads nothing itself, and the render reports a failure and reloads the
   * tab when that may cure it (chunkReload.ts), as for a load of its own. A
   * page that is never rendered has nothing to report.
   */
  readonly preload: () => void
}

/*
 * Pages whose module failed to load, each with a way to load it afresh.
 * `React.lazy` keeps a rejected import for good, so without this a page whose
 * chunk failed once - a student's connection dropped for a moment - stayed
 * broken until the browser was reloaded, and "Try again" showed the same
 * failure again (#272).
 */
const failedLoads = new Set<() => void>()

/** How long a page waits for the reload `chunkReload.ts` started before it counts as failed. */
export const RELOAD_GRACE_MS = 10_000

function reloadThatNeverCame(pageName: string): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(
      () => reject(new Error(`${pageName}: the page did not reload after its module failed to load`)),
      RELOAD_GRACE_MS,
    )
  })
}

/**
 * Lets every page whose module failed to load try again on its next render.
 *
 * Only an error boundary's "Try again" (or its reset on navigation) calls
 * this. A page never retries by itself: React renders a failed component once
 * more before it gives up, and a page that started a new load there would
 * fetch again and again for as long as the network stayed down.
 */
export function retryFailedPageLoads() {
  for (const reset of [...failedLoads]) reset()
}

/**
 * A page that is loaded on demand from its module's named export.
 *
 * The name is the export that actually renders, not a label written beside
 * it, so a route snapshot that compares page names compares what a visitor is
 * shown.
 */
export function lazyPage<Name extends string>(
  pageName: Name,
  load: () => Promise<Record<Name, PageComponent>>,
): LazyPage {
  // The page itself, once a load has brought its module in. A page mounted
  // after that renders it at once: through React.lazy it would suspend for a
  // moment even then, and the router's Suspense would show its skeleton for
  // React's minimum of 300 ms, about what a preload saves (#415).
  let loaded: PageComponent | undefined
  // The current attempt's load, one for a preload and the render together.
  // Vite asks for a page's stylesheet only the first time it loads the page in
  // a document: a render that loaded again after a preload had failed on the
  // stylesheet showed the page without it, and nothing reported the failure
  // (#441 audit). Shared, the render meets that failure, and it waits for a
  // stylesheet still on its way.
  let loading: Promise<Record<Name, PageComponent>> | undefined
  const loadPage = () =>
    (loading ??= load().then((module) => {
      loaded = module[pageName]
      return module
    }))
  const failed = (error: unknown): never => {
    const reset = () => {
      failedLoads.delete(reset)
      loading = undefined
      current = attempt()
    }
    failedLoads.add(reset)
    throw error
  }
  const attempt = () =>
    lazy(() =>
      loadPage()
        .then(
          (module) => ({ default: module[pageName] }),
          (error: unknown) =>
            // A module that failed to load may be one an older release named,
            // so the tab reloads (chunkReload.ts) and the page stays
            // loading until it does, rather than fail and report that. A
            // reload that never comes -- the reader chose to stay on a "Leave
            // site?" prompt -- is a failure after all, so the page offers
            // "Try again" instead of loading for good.
            reloadForFailedPage(error) ? reloadThatNeverCame(pageName) : Promise.reject(error),
        )
        .catch(failed),
    )
  let current = attempt()
  // `loaded` is set before React.lazy hears that the module is in, so the lazy
  // only ever suspends: by the time there is a page to show, it is shown
  // directly, and nothing on the screen is swapped for another component.
  const Page: PageComponent = (props) => createElement(loaded ?? current, props)
  Page.displayName = pageName
  const preload = () => {
    void loadPage().catch(() => {
      // Not this page's failure yet: see LazyPage.preload.
    })
  }
  return Object.assign(Page, { pageName, preload })
}
