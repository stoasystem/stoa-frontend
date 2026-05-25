# Phase 12 Organization Frontend Architecture

Phase 12 organization features are frontend-only demo surfaces. They define information architecture, typed API contracts, mock data, and route-level UI for schools and tutoring centers.

Out of scope:

- Production multi-tenant backend
- Organization database schema
- Formal permission inheritance
- School roster sync
- Enterprise billing or contract systems

Frontend contract routes:

- `GET /organizations`
- `GET /organizations/:organizationId/summary`
- `GET /organizations/:organizationId/students`
- `GET /organizations/:organizationId/tutors`
- `GET /organizations/:organizationId/reports`

Implementation pattern:

`Organization page -> organization components -> organization hooks -> organizationApi -> httpClient + withDemoFallback -> phase12MockData`

The selector and pages can switch between mock school and tutoring center workspaces. Real backend enforcement must be added later behind the same contracts.
