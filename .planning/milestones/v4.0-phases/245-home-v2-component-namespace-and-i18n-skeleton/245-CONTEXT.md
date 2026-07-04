---
status: ready
created: 2026-07-04
---

# Phase 245: Home V2 Component Namespace And i18n Skeleton - Context

**Gathered:** 2026-07-04
**Mode:** Auto-generated because `workflow.skip_discuss=true`

## Phase Boundary

Home V2 needs an isolated page/component namespace and provisional multilingual copy plumbing.

## Implementation Decisions

- Keep Home V2 components under `src/components/home-v2/`.
- Keep the preview page under `src/pages/home-v2/HomeV2Page.tsx`.
- Add a `homeV2` namespace to the existing i18n system.
- Add provisional EN/DE/FR/IT `homeV2.json` files, while only wiring currently supported app languages into active resources.

## Existing Code Insights

- Existing homepage components live under `src/components/home/`; do not modify them.
- Existing i18n active languages are English and German, but locale directories already include French and Italian files.
- Existing home hero uses `useAuthStore` for role-aware CTA targets.

## Deferred Ideas

- Final multilingual copy review.
- Final route screenshot QA.
- Final image insertion.
