# Research Summary — Phase 12

**Updated:** 2026-05-25
**Mode:** Research-first update after Phase 12 milestone approval

## Stack Additions

No required dependency additions at planning time. Start with existing React/Tailwind/TanStack Query stack plus typed services, `demoFallback`, and mock data.

Optional dependency gates:

- React Flow only if the curriculum graph needs pan/zoom/custom edges beyond a simple SVG/card-grid.
- Recharts only if advanced analytics needs richer chart primitives than simple cards/tables.
- MSW only if service-level demo fallback is insufficient for route smoke/E2E or Storybook-style network mocking.

## Feature Table Stakes

- Organization selector and organization dashboard.
- Organization students/tutors/reports/analytics.
- Advanced learning profile.
- Curriculum/topic graph UI.
- Weak-point diagnosis UI.
- Tutor assignment board and schedule overview.
- Parent monthly report.
- Advanced analytics and retention UI.
- Partnership onboarding and school/tutoring center entries.

## Architecture Guidance

Use the existing Phase 11 pattern: page components call hooks, hooks call typed services, services call `httpClient` with demo fallback, and mock data stays in `src/data`.

Keep advanced intelligence data precomputed in mock/API responses. The browser may render, filter, and select, but it should not implement diagnosis, graph computation, tutor matching, retention automation, or analytics warehouse behavior.

## Watch Out For

Keep Phase 12 strictly frontend-only. Do not add real multi-tenant backend, organization DB, AI diagnosis engine, graph computation backend, scheduling algorithm, or CRM/marketing automation system.

## Source Notes

- React Flow official docs confirm TypeScript node/edge typing support, so it is suitable if Phase 12 graph interaction grows beyond a simple custom view.
- Recharts official docs highlight parent-size-dependent responsive containers, so any chart implementation needs explicit stable dimensions.
- MSW official docs describe network-level mocking reusable across development and tests, but the existing repo pattern should remain the default until a concrete need appears.
