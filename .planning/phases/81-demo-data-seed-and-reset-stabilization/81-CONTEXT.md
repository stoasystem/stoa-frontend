# Phase 81: Demo Data Seed and Reset Stabilization - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Make demo data deterministic and resettable without adding production persistence complexity.

</domain>

<decisions>
## Implementation Decisions

Reuse the existing local FastAPI/SQLite demo backend and reset script. Keep SQLite documented as demo/test support only.

</decisions>

<code_context>
## Existing Code Insights

`backend/app/seed.py` already seeds fixed users, conversations, parent reports, tutor requests, analytics, and feedback. Missing Phase 14 data includes richer tutor request status coverage, support tickets, billing interest, and message attachment linkage.

</code_context>

<specifics>
## Specific Ideas

Extend the seed/reset data and add npm reset/start wrappers.

</specifics>

<deferred>
## Deferred Ideas

Endpoint behavior is handled in Phases 82-84.

</deferred>

