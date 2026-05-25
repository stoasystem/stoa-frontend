# Project Research — Architecture For Phase 12

## Proposed Shape

Phase 12 should follow the Phase 11 pattern:

`Page -> Feature Components -> Hooks -> Services -> httpClient + demoFallback -> typed mock data`

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

## Build Order

1. Platform boundary, types, mock data, services, hooks, organization selector.
2. Organization dashboard/students/tutors/reports.
3. Learning profile and diagnosis.
4. Curriculum graph.
5. Tutor assignment and schedule overview.
6. Parent monthly report, retention, advanced analytics.
7. Partnership onboarding and docs/QA.
