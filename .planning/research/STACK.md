# Project Research — Stack For Phase 12

**Updated:** 2026-05-25
**Mode:** Research-first update after Phase 12 milestone approval

## Current Stack To Keep

- React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, TailwindCSS/shadcn-style local primitives.
- Existing demo fallback pattern in `src/services/demo/demoFallback.ts`.
- Existing analytics wrapper in `src/services/analytics/analyticsClient.ts`.

## Recommended Additions

- Avoid new dependencies for the first platform slice unless graph/chart complexity proves necessary.
- Curriculum graph can start with custom SVG/card-grid components using typed mock coordinates. React Flow is a viable later add if interaction becomes complex; official docs show TypeScript support for typed node/edge unions and built-in node/edge types through `@xyflow/react`.
- Analytics charts can start with lightweight CSS/table/chart components. If execution later needs richer charts, Recharts is the likely add because it has React-first responsive chart support through `ResponsiveContainer`, including width/height/aspect sizing.
- MSW is a viable future mock layer if Phase 12 needs network-level mock parity across browser, tests, and Storybook. Official MSW materials describe browser and Node API mocking via Service Worker/network interception, but current `demoFallback` is cheaper and already matches the repo's Phase 11 pattern.
- Do not add real multi-tenant, CRM, BI, AI diagnosis, graph database, scheduling, or marketing automation packages in Phase 12.

## Integration Points

- `src/types/*` for organization, learning profile, curriculum graph, diagnosis, tutor assignment, partnership.
- `src/services/*` + `src/hooks/*` using TanStack Query and demo fallback.
- Existing `AppRouter`, `AppLayout`, `MarketingLayout`, and admin/parent/tutor route structures.

## Watchouts

- Do not introduce React Flow/Recharts by default during planning; decide during execution after inspecting UI complexity.
- Keep mock data behind services and `src/data`, not embedded in pages.
- If React Flow is added later, keep graph node/edge types narrow and typed; avoid creating a general graph engine.
- If Recharts is added later, define stable container dimensions so responsive charts render reliably.
- If MSW is added later, keep handlers generated from/kept aligned with the same frontend API contracts used by services.

## Primary Sources

- React Flow TypeScript docs: https://reactflow.dev/learn/advanced-use/typescript
- Recharts `ResponsiveContainer` docs: https://recharts.github.io/en-US/api/ResponsiveContainer/
- MSW official site/GitHub overview: https://mswjs.io/ and https://github.com/mswjs
