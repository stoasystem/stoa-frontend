---
status: ready
created: 2026-07-04
---

# Phase 244: Home V2 Route And Public Inventory - Context

**Gathered:** 2026-07-04
**Mode:** Auto-generated because `workflow.skip_discuss=true`

## Phase Boundary

Home V2 needs a public preview route that is reachable without changing the existing homepage.

## Implementation Decisions

- Add `/home-v2` as a public route in the existing `AppRouter`.
- Keep `/` mapped to the current `HomePage`.
- Add `/home-v2` to `routeGroups.public` for inventory consistency.
- Create only the minimal page required for route compilation in this phase; component/i18n expansion belongs to Phase 245.

## Existing Code Insights

- `src/App.tsx` delegates to `src/app/router/AppRouter.tsx`.
- Public routes are direct `<Route>` entries before the protected route group.
- Public inventory is maintained in `src/app/router/routeGroups.ts`.
- Existing public pages use `MarketingLayout`.

## Deferred Ideas

- Full Home V2 section component namespace.
- `homeV2` i18n namespace.
- Preview-quality visual skeleton.
