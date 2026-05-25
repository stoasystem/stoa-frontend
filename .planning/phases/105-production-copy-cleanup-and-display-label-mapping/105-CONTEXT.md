# Phase 105: Production Copy Cleanup and Display Label Mapping - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Remove user-visible development language and prevent raw internal statuses from rendering.
</domain>

<decisions>
## Implementation Decisions

### Agent Discretion

Keep internal variable names and API contracts stable. Clean rendered copy and locale values. Add label mapping at UI boundaries instead of changing backend/fallback data structures.
</decisions>

<code_context>
## Existing Code Insights

Risk areas include auth/register locale copy, billing/pricing checkout copy, admin/home locale copy, raw status rendering in support/tutor/parent/learning pages, and hardcoded descriptions on demo-era pages.
</code_context>

<specifics>
## Specific Ideas

- Add display label helpers and `SafeStatusLabel`.
- Add user-facing error sanitization helper.
- Update EN/DE/FR/IT locale values together.
- Replace obvious demo/mock/placeholder wording in P0/P1/P2 rendered page descriptions.
</specifics>

<deferred>
## Deferred Ideas

Broader pending/error/empty state behavior is deferred to Phase 106. Final scan and browser QA are deferred to Phase 107.
</deferred>
