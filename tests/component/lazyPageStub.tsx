/* Stands in for `@/app/router/lazyPage` in the router tests: each page becomes
 * a synchronous stub that prints the export it would have loaded. Kept apart
 * from routeHarness.tsx, which imports the router that imports this. */
export function lazyPage(pageName: string) {
  return Object.assign(
    (props: { title?: string }) => (
      <p data-testid="page">{props.title ? `${pageName} title="${props.title}"` : pageName}</p>
    ),
    { pageName },
  )
}
