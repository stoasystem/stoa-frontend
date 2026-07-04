# Home V2 Route And Component Handoff

**Date:** 2026-07-04
**Milestone:** v4.0 新版路由与组件骨架
**Status:** Route/component skeleton handoff

## What Changed

Home V2 now exists as an isolated preview route:

```text
/home-v2
```

The current homepage route remains unchanged:

```text
/ -> src/pages/home/HomePage.tsx
```

## Implementation Files

Route and inventory:

- `src/app/router/AppRouter.tsx`
- `src/app/router/routeGroups.ts`

Page:

- `src/pages/home-v2/HomeV2Page.tsx`

Component namespace:

- `src/components/home-v2/HomeV2Hero.tsx`
- `src/components/home-v2/HomeV2LearningThread.tsx`
- `src/components/home-v2/HomeV2ParentConfidence.tsx`
- `src/components/home-v2/HomeV2TrustLayer.tsx`
- `src/components/home-v2/HomeV2FinalCta.tsx`
- `src/components/home-v2/HomeV2VisualFrame.tsx`

i18n skeleton:

- `src/i18n/locales/en/homeV2.json`
- `src/i18n/locales/de/homeV2.json`
- `src/i18n/locales/fr/homeV2.json`
- `src/i18n/locales/it/homeV2.json`
- `src/i18n/namespaces.ts`
- `src/i18n/index.ts`

Verification:

- `tests/e2e/home-v2.spec.ts`

## Design Boundary

v4.0 intentionally implements a previewable skeleton, not a final homepage.

Included:

- Public `/home-v2` preview route.
- Five-section Home V2 structure.
- Section-level component namespace.
- Provisional `homeV2` i18n copy.
- Stable section IDs and test hooks.
- Placeholder-safe proof and visual frames.

Deferred:

- Final image crop and optimization.
- WebP/AVIF variants.
- Paid or commissioned Hero photography.
- Full motion choreography.
- Final EN/DE/FR/IT copywriting.
- Screenshot and visual regression approval.
- Replacing `/` with Home V2.

## Verification Commands

```bash
npm run lint
npm run build
npm run test:e2e -- home-v2.spec.ts
```

## Next Implementation Handoff

The next milestone can safely start from:

```text
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/
```

Recommended next workstreams:

1. Final asset selection and optimized responsive crops.
2. Motion choreography with reduced-motion guardrails.
3. Final four-language copy refinement.
4. Desktop/mobile screenshot QA before any `/` switch decision.
