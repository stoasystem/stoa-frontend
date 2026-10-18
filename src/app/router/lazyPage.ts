import { createElement, lazy, type ComponentType } from 'react'

/* The props a page receives from the route manifest: whatever its entry lists
 * under `props`, plus the entry's `titleKey` when it has one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pages differ in props; the manifest supplies them
export type PageComponent = ComponentType<any>

export type LazyPage = PageComponent & {
  /** The named export the page is loaded from, e.g. `TeacherDashboardPage`. */
  readonly pageName: string
}

/*
 * Pages whose module failed to load, each with a way to load it afresh.
 * `React.lazy` keeps a rejected import for good, so without this a page whose
 * chunk failed once - a student's connection dropped for a moment - stayed
 * broken until the browser was reloaded, and "Try again" showed the same
 * failure again (#272).
 */
const failedLoads = new Set<() => void>()

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
  const attempt = () =>
    lazy(() =>
      load().then(
        (module) =>
          // Vite hands back nothing when the tab is about to reload for a
          // failed import (chunkReload.ts): stay loading until it does,
          // rather than fail on a missing module and report that.
          module ? { default: module[pageName] } : new Promise<never>(() => {}),
        (error: unknown) => {
          const reset = () => {
            failedLoads.delete(reset)
            current = attempt()
          }
          failedLoads.add(reset)
          throw error
        },
      ),
    )
  let current = attempt()
  const Page: PageComponent = (props) => createElement(current, props)
  Page.displayName = pageName
  return Object.assign(Page, { pageName })
}
