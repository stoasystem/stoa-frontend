# Phase 123: Final Demo Package and Audience Scripts - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Create the final demo package and audience-specific demo scripts for formal review, investor demo, parent demo, student demo, tutor demo, admin demo, and internal launch-candidate checks.

</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion

Use the existing demo/backend docs as source material. Do not add product features or alter demo behavior in this phase. The deliverable is a stable documentation package under `docs/demo/final-demo-package/`.

</decisions>

<code_context>
## Existing Code Insights

- `docs/demo/current-project-demo-guide.md` already documents broad demo routes, accounts, reset, and troubleshooting.
- `docs/demo/final-demo-flow.md` contains an older final demo flow and pages to avoid.
- `package.json` exposes `npm run dev`, `npm run demo:backend`, `npm run demo:reset`, `npm run build`, and `npm run test:e2e`.

</code_context>

<specifics>
## Specific Ideas

Create overview, investor, parent, student, tutor, admin, limitations, and troubleshooting docs. Keep scripts audience-specific and concise enough for live use.

</specifics>

<deferred>
## Deferred Ideas

Account/data validation and API contract locking are handled in Phase 124.

</deferred>

