---
status: complete
created: 2026-07-04
completed: 2026-07-04
---

# Phase 244 Plan

## Goal

Add the isolated `/home-v2` public preview route without replacing or changing `/`.

## Tasks

- Add a minimal `HomeV2Page` under `src/pages/home-v2/`.
- Register `/home-v2` in `AppRouter`.
- Register `/home-v2` in `routeGroups.public`.
- Verify the route work does not alter the current `/` mapping.

## Acceptance

- `ROUTE-01`: `/home-v2` has a public route element.
- `ROUTE-02`: `/` still renders `HomePage`.
- `ROUTE-03`: `/home-v2` appears in public route inventory.
