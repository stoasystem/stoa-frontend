# Phase 85: Frontend API Mode and Service Layer Alignment - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Keep the frontend decoupled from demo backend internals and ready to switch API modes.

</domain>

<decisions>
## Implementation Decisions

Add explicit API mode configuration while preserving current service-layer architecture. Keep direct `fetch` only inside services that need it for streaming or fire-and-forget analytics.

</decisions>

<code_context>
## Existing Code Insights

Explorer audit found no direct API calls in `src/pages`, `src/components`, or `src/hooks`. Gaps were missing `apiMode`, fallback-on-error behavior, direct API base URL reads outside `src/lib/env.ts`, and production example enabling demo API.

</code_context>

<specifics>
## Specific Ideas

Update `.env.example`, `src/lib/env.ts`, `src/services/api/httpClient.ts`, demo fallback behavior, streaming service, analytics service, auth fallback, and admin dashboard environment display.

</specifics>

<deferred>
## Deferred Ideas

Full MSW setup remains optional and is not required for Phase 14 completion.

</deferred>

