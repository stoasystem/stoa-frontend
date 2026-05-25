# Research Summary — Phase 12

## Stack Additions

No required dependency additions at planning time. Start with existing React/Tailwind/TanStack Query stack plus typed services and mock data. Consider Recharts or React Flow only during execution if simple components cannot satisfy chart/graph usability.

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

## Watch Out For

Keep Phase 12 strictly frontend-only. Do not add real multi-tenant backend, organization DB, AI diagnosis engine, graph computation backend, scheduling algorithm, or CRM/marketing automation system.
