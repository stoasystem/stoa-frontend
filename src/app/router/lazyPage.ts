import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/* The props a page receives from the route manifest: whatever its entry lists
 * under `props`, plus the entry's `titleKey` when it has one. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pages differ in props; the manifest supplies them
export type PageComponent = ComponentType<any>

export type LazyPage = LazyExoticComponent<PageComponent> & {
  /** The named export the page is loaded from, e.g. `TeacherDashboardPage`. */
  readonly pageName: string
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
  const page = lazy(() => load().then((module) => ({ default: module[pageName] })))
  return Object.assign(page, { pageName })
}
