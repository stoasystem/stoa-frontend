# Project Research Summary: v4.0 Home V2 Skeleton

**Date:** 2026-07-04
**Milestone:** v4.0 新版路由与组件骨架

## Stack Additions

No new dependencies are recommended.

Use the existing stack:

- React 19
- React Router DOM v7 declarative routing
- TypeScript
- Vite
- Tailwind CSS v4
- react-i18next
- existing UI primitives and global brand/theme tokens

Official docs confirm the current route style is appropriate for adding `/home-v2`, Vite can later import optimized assets into the build graph, and React `lazy`/`Suspense` are available if Home V2 later needs route-level splitting.

Sources:

- https://reactrouter.com/start/declarative/routing
- https://vite.dev/guide/assets.html
- https://react.dev/reference/react/lazy
- https://react.dev/reference/react/Suspense

## Table Stakes

- Add public `/home-v2` route without changing `/`.
- Add `src/pages/home-v2/HomeV2Page.tsx`.
- Add isolated `src/components/home-v2/` section components.
- Render five locked IA sections: Hero, Learning Thread, Parent Confidence, Swiss Trust Layer, Final CTA.
- Make the skeleton previewable: real layout rhythm, placeholder media/proof surfaces, CTA placement, responsive behavior.
- Add `homeV2` i18n namespace with provisional EN/DE/FR/IT resources.
- Update route inventory through `routeGroups.public`.

## Architecture Direction

Preferred file shape:

```text
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/HomeV2Hero.tsx
src/components/home-v2/HomeV2LearningThread.tsx
src/components/home-v2/HomeV2ParentConfidence.tsx
src/components/home-v2/HomeV2TrustLayer.tsx
src/components/home-v2/HomeV2FinalCta.tsx
src/components/home-v2/HomeV2VisualFrame.tsx
src/i18n/locales/*/homeV2.json
```

`MarketingLayout` can be reused for the preview route if it does not block the Home V2 visual contract. Current `src/components/home/` should remain untouched.

## Watch Out For

- Do not replace `/`.
- Do not make an empty shell; user selected a previewable skeleton.
- Do not implement final images, full animation, final copy, screenshot QA, or homepage switch-over in v4.0.
- Do not hard-code English text.
- Do not treat candidate images as final optimized assets.
- Do not let dense app card patterns or generic SaaS grids define Home V2.
- Do not reintroduce AI-forward or instant-solver homepage language.

## Recommended Requirement Categories

- Routing
- Component Skeleton
- Preview Layout
- i18n
- Boundaries And Verification
