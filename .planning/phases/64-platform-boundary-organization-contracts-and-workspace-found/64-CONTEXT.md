# Phase 64: Platform Boundary, Organization Contracts, and Workspace Foundation - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish Phase 12 as frontend-only platform demo work: organization/workspace contracts, mock data, demo fallback services, hooks, selector UI, and analytics events. Production organization backend, database, tenant permissions, AI diagnosis, graph computation, scheduling, analytics backend, and partnership backend remain out of scope.
</domain>

<decisions>
## Implementation Decisions

### Frontend-Only Boundary
- Use typed API contracts and `withDemoFallback`.
- Keep mock data in `src/data/phase12MockData.ts`.
- Do not introduce production backend/database concepts.

### Organization Foundation
- Add organization types, services, hooks, and selector.
- Support school and tutoring center demo workspaces.
- Track organization switch events with sanitized analytics payloads.

### the agent's Discretion
Use current Phase 11 page/hook/service patterns.
</decisions>

<code_context>
## Existing Code Insights

Phase 11 already established `httpClient + withDemoFallback`, React Query hooks, `DashboardLayout`, `MarketingLayout`, local UI primitives, and `trackEvent`.
</code_context>

<specifics>
## Specific Ideas

The user explicitly confirmed Phase 12 should stay frontend-only and that any backend-like code is only for demo/testing.
</specifics>

<deferred>
## Deferred Ideas

Production multi-tenant backend, school organization backend, real AI diagnosis, graph engine, scheduling algorithms, production analytics backend.
</deferred>
