# Phase 124: Demo Account, Demo Data, Reset, and API Contract Lock - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Lock the final demo accounts, expected demo data, reset behavior, and final demo backend API contract.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion

Use existing `backend/app/seed.py`, `docs/demo-backend/demo-data.md`, and `docs/demo-backend/demo-api-contract.md` as the source of truth. Do not change backend behavior unless validation reveals a blocker.

</decisions>

<code_context>
## Existing Code Insights

- `backend/app/seed.py` seeds four fixed users and role-linked student/parent/tutor/admin data.
- `package.json` exposes `npm run demo:reset`.
- Existing API contract docs already cover most required endpoints.

</code_context>

<specifics>
## Specific Ideas

Create demo account, reset, and final API contract lock docs under the final package and release docs.

</specifics>

<deferred>
## Deferred Ideas

Actual final demo run evidence is recorded in Phase 127.

</deferred>

