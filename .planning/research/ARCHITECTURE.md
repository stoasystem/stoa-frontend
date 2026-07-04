# Project Research: Architecture For v4.0 Home V2 Skeleton

**Milestone:** v4.0 新版路由与组件骨架
**Date:** 2026-07-04
**Scope:** How the Home V2 skeleton should integrate with the existing frontend architecture.

## Existing Integration Points

### Router

- `src/App.tsx` delegates to `AppRouter`.
- `src/app/router/AppRouter.tsx` owns route declarations.
- Public routes are top-level `<Route>` entries before the protected route block.
- `routeGroups.public` lists public route inventory.

Integration:

- Import `HomeV2Page` in `AppRouter.tsx`.
- Add `/home-v2` near the existing `/` and public marketing routes.
- Add `/home-v2` to `routeGroups.public`.

### Layout

- Existing HomePage uses `MarketingLayout`.
- MarketingLayout likely owns public nav/footer framing.

Integration:

- Reuse `MarketingLayout` for v4.0 unless it blocks the v2.7 visual contract.
- Do not create a new global layout in v4.0.
- If Home V2 needs local layout nuance, keep it inside `HomeV2Page` or local components.

### Components

Existing current-home components live under `src/components/home/`.

Integration:

- Create `src/components/home-v2/`.
- Avoid importing current-home section components into Home V2.
- Reuse shared primitives such as `Button`, `Badge`, `AppLogo`, and utility helpers where appropriate.
- Keep component data local unless it clearly belongs in i18n.

### i18n

Existing namespace model:

- `src/i18n/namespaces.ts` exports a namespace tuple.
- `src/i18n/index.ts` imports JSON files and registers resources.

Integration:

- Add `homeV2` to namespace list.
- Add EN/DE/FR/IT `homeV2.json` files.
- Import and register those files for all supported languages.

Risk:

- Current `index.ts` visibly registers EN/DE in the inspected excerpt. Before implementation, verify whether FR/IT are registered later in the file or need correction as part of v4.0.

### Assets

Candidate images live under `img/home-v2/candidates/`, outside `src`.

Integration:

- v4.0 should not depend on final image processing.
- If route uses a real candidate image, it should be marked as candidate/prototype and not treated as final optimized asset.
- Later optimized app assets should probably live in a Vite-imported path inside `src/assets/` or public asset namespace, depending on the chosen pipeline.

## Suggested File Structure

```text
src/pages/home-v2/HomeV2Page.tsx
src/components/home-v2/HomeV2Hero.tsx
src/components/home-v2/HomeV2LearningThread.tsx
src/components/home-v2/HomeV2ParentConfidence.tsx
src/components/home-v2/HomeV2TrustLayer.tsx
src/components/home-v2/HomeV2FinalCta.tsx
src/components/home-v2/HomeV2VisualFrame.tsx
src/components/home-v2/homeV2Content.ts
src/i18n/locales/en/homeV2.json
src/i18n/locales/de/homeV2.json
src/i18n/locales/fr/homeV2.json
src/i18n/locales/it/homeV2.json
```

Keep `homeV2Content.ts` small. Use it for typed arrays like learning-thread beats if putting array content directly in i18n is awkward. Prefer i18n for visible strings.

## Suggested Build Order

1. Wire route and page shell.
2. Add component namespace and static five-section skeleton.
3. Add `homeV2` i18n namespace and provisional copy.
4. Add CTA target helper using existing auth-store pattern.
5. Add responsive visual frame and placeholder proof surfaces.
6. Add basic smoke verification for `/home-v2`.
7. Update docs/README handoff.

## Architecture Boundaries

Do not:

- Move existing homepage components.
- Change `/` route.
- Change global auth behavior.
- Change registration flow or quota behavior.
- Add app-wide visual tokens unless the skeleton cannot be implemented with existing tokens.
- Add final asset pipeline.

Do:

- Keep route and namespace isolated.
- Keep section components independently replaceable.
- Keep provisional copy clearly separated in `homeV2`.
- Preserve the later ability to add animation and optimized images without replacing the component tree.
