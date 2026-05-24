# Project Research: Architecture for v1.6 Phase 7

**Milestone:** v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness
**Date:** 2026-05-25

## Existing Architecture

The app is a React SPA using Vite, React Router, TanStack Query, Axios service modules, local UI components, and Zustand stores. v1.5 added authenticated role routes and a local FastAPI + SQLite backend with student, parent, tutor, and admin role surfaces.

## Recommended Phase 7 Architecture

### Shared UI Layer

- Add `PageContainer`, `PageHeader`, and `SectionHeader`.
- Add skeleton primitives and page-specific skeleton compositions.
- Keep route pages responsible for data composition, but centralize page framing.
- Document usage in `src/styles/ui-guidelines.md`.

### Feedback and Validation Layer

- Add Toaster in `AppProviders`.
- Add validation schemas in `src/lib/validation.ts`.
- Keep immediate form errors near the relevant fields.
- Use toast for operation result feedback.

### Error Boundary

- Wrap the app with `AppErrorBoundary` near the provider/router root.
- Fallback should let the user retry without exposing stack traces.

### Analytics Layer

- Add `src/services/analytics/analyticsClient.ts`.
- `trackEvent(name, payload)` logs in development and respects `VITE_ENABLE_ANALYTICS`.
- Later implementations can send to `POST /analytics/events` without touching page code.

### Parent Report Data Flow

- Type: `src/types/parentReport.ts`.
- Service: `src/services/parent/parentReportApi.ts`.
- Hook: `src/hooks/parent/useChildReportQuery.ts`.
- Page: `src/pages/parent/ChildReportPage.tsx`.
- Backend: `GET /parents/me/children/:childId/report`.

### Tutor Note Data Flow

- Backend table: `teacher_notes`.
- Endpoint: `POST /tutors/me/help-requests/:requestId/notes`.
- Frontend component: `TutorRequestNoteForm`.
- Query invalidation refreshes request detail after note creation.

### Environment Layer

- Add `src/lib/env.ts` for `appEnv`, `isDevelopment`, `isStaging`, `isProduction`, `enableDemoShortcuts`, and `enableAnalytics`.
- Update `.env.example` for local, staging, and production expectations.

## Build Order

1. Shared UI standards, containers, and skeletons.
2. Toast, validation, and error boundary.
3. Analytics client and environment flags.
4. Parent report types/API/hook/page/backend seed.
5. Tutor workflow filters and notes.
6. Demo shortcuts, README, and verification checklist.
