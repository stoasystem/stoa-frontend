# Project Research — Stack For Phase 12

## Current Stack To Keep

- React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, TailwindCSS/shadcn-style local primitives.
- Existing demo fallback pattern in `src/services/demo/demoFallback.ts`.
- Existing analytics wrapper in `src/services/analytics/analyticsClient.ts`.

## Recommended Additions

- Avoid new dependencies for the first platform slice unless graph/chart complexity proves necessary.
- Curriculum graph can start with custom SVG/card-grid components using typed mock coordinates.
- Analytics charts can start with lightweight CSS/table/chart components. If execution later needs richer charts, `recharts` is the likely add because it fits React dashboards.
- Do not add real multi-tenant, CRM, BI, AI diagnosis, graph database, scheduling, or marketing automation packages in Phase 12.

## Integration Points

- `src/types/*` for organization, learning profile, curriculum graph, diagnosis, tutor assignment, partnership.
- `src/services/*` + `src/hooks/*` using TanStack Query and demo fallback.
- Existing `AppRouter`, `AppLayout`, `MarketingLayout`, and admin/parent/tutor route structures.

## Watchouts

- Do not introduce React Flow/Recharts by default during planning; decide during execution after inspecting UI complexity.
- Keep mock data behind services and `src/data`, not embedded in pages.
