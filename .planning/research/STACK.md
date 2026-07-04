# Project Research: Stack For v4.0 Home V2 Skeleton

**Milestone:** v4.0 新版路由与组件骨架
**Date:** 2026-07-04
**Scope:** Stack decisions for adding an isolated, previewable Home V2 route and component skeleton.

## Existing Stack To Preserve

- React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM v7, react-i18next, lucide-react, and existing shadcn-style UI primitives are already present.
- Routing is centralized in `src/app/router/AppRouter.tsx`, not in `src/App.tsx`.
- Public route grouping lives in `src/app/router/routeGroups.ts`.
- Existing homepage implementation lives in `src/pages/home/HomePage.tsx` and `src/components/home/`.
- Existing global visual tokens and role-based typography are already wired through `src/index.css` plus `src/styles/*.css`.

## Official Documentation Findings

- React Router declarative routing supports adding route entries through `<Routes>` and `<Route>`, matching the project's existing `BrowserRouter` pattern.
- React Router nested/layout routes are available, but v4.0 does not need nested routing for a single `/home-v2` preview page.
- Vite static asset imports return resolved public URLs and include referenced assets in the build graph. This matters later when optimized Home V2 images move from candidate storage into app-consumed assets.
- React `lazy` can defer component loading until first render, and `Suspense` provides a fallback while lazy code loads. This is useful later if Home V2 becomes visually heavy, but v4.0 can avoid route-level lazy loading unless implementation size grows.

Source references:

- React Router declarative routing: https://reactrouter.com/start/declarative/routing
- Vite static asset handling: https://vite.dev/guide/assets.html
- React lazy: https://react.dev/reference/react/lazy
- React Suspense: https://react.dev/reference/react/Suspense

## Recommended Stack Approach

### Routing

Use the existing declarative route system:

- Add `HomeV2Page` import to `src/app/router/AppRouter.tsx`.
- Add `<Route path="/home-v2" element={<HomeV2Page />} />` among public routes.
- Add `/home-v2` to `routeGroups.public`.
- Do not protect `/home-v2`; it is a public preview route.
- Do not replace `/`.

### Component Namespace

Create a separate namespace:

```text
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/
```

Keep current `src/components/home/` untouched except for possible future shared primitive extraction. v4.0 should not refactor the current homepage.

### Styling

Prefer Tailwind utility composition and existing CSS tokens:

- Use current font role classes and global font rules.
- Use existing brand variables for charcoal, burgundy, paper, muted sage/gold, and neutral surfaces.
- Add Home V2-specific CSS only if Tailwind utilities cannot express a stable skeleton pattern cleanly.
- Respect `prefers-reduced-motion` for any reveal placeholders.

### i18n

Add `homeV2` namespace wiring as a skeleton dependency:

- `src/i18n/locales/en/homeV2.json`
- `src/i18n/locales/de/homeV2.json`
- `src/i18n/locales/fr/homeV2.json`
- `src/i18n/locales/it/homeV2.json`
- Update `src/i18n/namespaces.ts`.
- Update `src/i18n/index.ts` resource imports.

Copy can be structural and provisional in v4.0. Final copy refinement remains later scope.

### Assets

Do not insert final optimized assets yet.

Allowed in v4.0:

- Placeholder image/proof surfaces.
- Optional use of local candidate paths only if they remain clearly non-final and do not require crop/optimization work.

Deferred:

- WebP/AVIF generation.
- Final responsive crops.
- Final alt text localization.
- Paid asset purchase or final Hero approval.

## Stack Non-Goals

- No new routing library.
- No animation library.
- No CMS/content backend.
- No image optimization pipeline in this milestone.
- No React Router framework-mode migration.
- No public homepage switch-over.
