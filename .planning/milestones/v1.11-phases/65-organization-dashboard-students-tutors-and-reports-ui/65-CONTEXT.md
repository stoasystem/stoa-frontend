# Phase 65: Organization Dashboard, Students, Tutors, and Reports UI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build organization pages that demonstrate workspace-level operations for schools and tutoring centers using mock/API contract data only.
</domain>

<decisions>
## Implementation Decisions

- Use admin/organization demo routes.
- Reuse `DashboardLayout`, `PageContainer`, `PageHeader`, and local card/table patterns.
- Keep organization selector and data rendering deterministic.
</decisions>

<code_context>
## Existing Code Insights

App routes are centralized in `src/app/router/AppRouter.tsx`; role navigation is in `src/layouts/AppLayout.tsx`.
</code_context>

<specifics>
## Specific Ideas

Expose `/organization`, `/organization/students`, `/organization/tutors`, `/organization/reports`.
</specifics>

<deferred>
## Deferred Ideas

Real tenant navigation, roster import, permission inheritance.
</deferred>
