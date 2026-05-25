# Phase 82: Auth, Health, Student Chat, and Message Demo APIs - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Stabilize the core student-facing backend demo loop.

</domain>

<decisions>
## Implementation Decisions

Keep existing auth token mechanics as opaque demo tokens. Standardize HTTP errors to `{ message, code }` while preserving status codes.

</decisions>

<code_context>
## Existing Code Insights

`backend/app/main.py` already contained health, auth, conversation, message, and mock streaming endpoints. Gaps were health shape, standardized errors, deterministic assistant copy, and attachment response handling.

</code_context>

<specifics>
## Specific Ideas

Update health response, add HTTPException handler, preserve attachment IDs in message sends, and include seeded attachment metadata in message responses.

</specifics>

<deferred>
## Deferred Ideas

Production auth and real AI streaming remain out of scope.

</deferred>

