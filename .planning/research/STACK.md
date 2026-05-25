# Stack Research

**Domain:** Frontend information architecture, navigation, and UX optimization for a React SPA
**Researched:** 2026-05-25
**Confidence:** HIGH

## Recommended Stack

Phase 13 should not add new runtime dependencies. The existing STOA stack already has the required primitives for route inventory, role navigation, breadcrumbs, back buttons, page actions, layout consistency, and mobile navigation.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^19.0.0 | Component rendering | Existing app framework; no IA work requires a framework change. |
| React Router DOM | ^7.0.0 | Routes, links, active navigation | Existing router. Official NavLink docs support active/pending link states and `aria-current="page"` for active links. |
| TypeScript | ^5.5.0 | Typed route/nav metadata | Route config and navigation utilities should be typed so hidden/demo/status/role decisions are compile-time visible. |
| Vite | ^6.0.0 | Dev/build tooling | Existing build path; Phase 13 should preserve standard npm scripts. |
| TailwindCSS | ^4.3.0 | Styling utilities | Existing styling layer; sufficient for layout and mobile nav cleanup without CSS framework churn. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.16.0 | Navigation/action icons | Use in nav, back buttons, page actions, and mobile affordances when an icon improves scanability. |
| @radix-ui/react-dialog | ^1.1.15 | Drawer/dialog primitives | Use only if mobile navigation needs an accessible drawer/sheet and existing app patterns support it. |
| @radix-ui/react-tabs | ^1.1.13 | Report/detail tab grouping | Useful for consolidating parent report/history/monthly report overlap where tabs already fit local UI conventions. |
| class-variance-authority / clsx / tailwind-merge | existing | Variant composition | Reuse for PageActions, BackButton, Breadcrumbs, and role/status badges if variants are needed. |
| Playwright | ^1.60.0 | Route and flow smoke checks | Use for demo and core path verification after navigation changes. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `rg` | Route/page inventory | Use `rg "<Route path=" src/app/router src/pages` and `rg --files src/pages` to reconcile routes and page components. |
| `npm run lint` | Static quality gate | Run after route/nav config and component changes. |
| `npm run build` | Type/build gate | Required acceptance gate for Phase 13. |
| `npm run test:e2e` | Core path verification | Update only when final demo/core route paths change. |

## Installation

No package installation is recommended for Phase 13.

```bash
# Keep existing dependencies.
npm install
npm run lint
npm run build
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Typed local `routeConfig.ts` | File-system router migration | Only consider later if STOA adopts a data-router/file-route architecture broadly. |
| Existing declarative `<Routes>` | `createBrowserRouter` migration | Not needed for Phase 13; would increase scope. Could be revisited if route-level loaders/handles become necessary. |
| Simple Breadcrumbs component from metadata | React Router route `handle` + `useMatches` | Good future pattern, but current app uses declarative routes and can start with explicit breadcrumb props/config. |
| Existing AppLayout | New navigation package | Avoid dependency churn; local config is enough. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New routing framework | Phase 13 is organization work, not architecture replacement. | Typed config around existing React Router. |
| Untyped string arrays for nav | They recreate the current drift problem. | `AppNavItem` and route group types. |
| URL-derived breadcrumbs only | Dynamic ids produce poor labels and incorrect hierarchy. | Explicit breadcrumb metadata, with dynamic labels passed by page context. |
| Large component-library rewrite | Out of scope and risky. | Narrow Breadcrumbs, BackButton, PageActions helpers. |
| Adding hidden/demo routes to core nav | Makes roles confusing. | Status/priority filtering in `navigation.ts`. |

## Stack Patterns by Variant

**If the page is a core first-level route:**
- Use role-filtered nav item metadata and no breadcrumb.
- Because primary navigation should orient the user without duplicating hierarchy.

**If the page is a second-level or detail route:**
- Use Breadcrumbs and/or BackButton.
- Because WAI and USWDS guidance frame breadcrumbs as orientation for hierarchical interior pages.

**If the page is demo/advanced/placeholder:**
- Mark it in route config and docs, hide from default role nav, and expose only through contextual cards or demo flows.
- Because Phase 13 should protect core paths from feature sprawl.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react-router-dom ^7.0.0 | React ^19.0.0 | Existing app compiles with this pairing; use `NavLink` active state instead of manual active class logic. |
| TailwindCSS ^4.3.0 | Vite ^6.0.0 | Existing setup; no new styling tooling needed. |
| Playwright ^1.60.0 | Vite dev server | Existing E2E setup can verify final demo/core route paths. |

## Sources

- React Router NavLink docs: https://reactrouter.com/api/components/NavLink
- React Router handle/useMatches docs: https://reactrouter.com/how-to/using-handle
- WAI-ARIA APG Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- WCAG 2.2 Recommendation: https://www.w3.org/TR/WCAG22/
- U.S. Web Design System Breadcrumb: https://designsystem.digital.gov/components/breadcrumb/
- Material Design Navigation Drawer: https://m2.material.io/components/navigation-drawer
- Material Design Bottom Navigation: https://m2.material.io/develop/flutter/components/bottom-navigation/
- Existing STOA code: `package.json`, `src/app/router/AppRouter.tsx`, `src/layouts/AppLayout.tsx`

---
*Stack research for: STOA Phase 13 frontend IA and UX optimization*
*Researched: 2026-05-25*
