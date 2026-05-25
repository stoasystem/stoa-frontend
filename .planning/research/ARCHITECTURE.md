# Project Research — Architecture For Phase 12

**Updated:** 2026-05-25
**Mode:** Research-first update after Phase 12 milestone approval

## Proposed Shape

Phase 12 should follow the Phase 11 pattern:

`Page -> Feature Components -> Hooks -> Services -> httpClient + demoFallback -> typed mock data`

This keeps mock behavior swappable when real backend APIs arrive and avoids temporary demo state leaking into reusable UI components.

## New Areas

- `src/types/organization.ts`
- `src/types/learningProfile.ts`
- `src/types/curriculumGraph.ts`
- `src/types/diagnosis.ts`
- `src/types/tutorAssignment.ts`
- `src/types/partnership.ts`
- `src/services/organization/*`
- `src/services/learning/*`
- `src/services/partnership/*`
- `src/hooks/organization/*`
- `src/hooks/learning/*`
- `src/hooks/partnership/*`
- `src/pages/organization/*`
- `src/pages/learning/*`
- `src/pages/partnership/*`

## Data Flow

- Organization selector reads organizations and stores selected workspace in client state or local component state.
- Organization pages pass selected organization ID to query hooks.
- Learning intelligence pages query by `studentId`.
- Partnership form posts to mock/demo contract and displays confirmation.
- Analytics events use existing `trackEvent` with sanitized structural payloads.
- Curriculum graph nodes/edges should be static data from the service layer; the UI may track selected topic ID locally.
- Advanced analytics charts should accept already-aggregated arrays. The frontend should not calculate warehouse-like cohorts from raw event logs.
- Tutor assignment board should render suggestions returned by mock/API contract, not compute matching logic in the browser.

## Build Order

1. Platform boundary, types, mock data, services, hooks, organization selector.
2. Organization dashboard/students/tutors/reports.
3. Learning profile and diagnosis.
4. Curriculum graph.
5. Tutor assignment and schedule overview.
6. Parent monthly report, retention, advanced analytics.
7. Partnership onboarding and docs/QA.

## Library Decision Gates

- **React Flow:** Add only if custom SVG/card-grid graph cannot support topic selection, pan/zoom, and readable edge rendering. If added, use typed node/edge unions as recommended in official React Flow TypeScript docs.
- **Recharts:** Add only if simple metric cards/tables are insufficient for Phase 12 analytics. If added, wrap charts in containers with explicit height/min-height because responsive charts depend on parent sizing.
- **MSW:** Add only if route smoke/E2E flows need network-level request interception rather than the existing service-level `demoFallback`.
