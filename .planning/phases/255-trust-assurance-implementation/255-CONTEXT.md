# Phase 255: Trust Assurance Implementation - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the approved Trust/Assurance direction in `/home-v2` only.
</domain>

<decisions>
## Implementation Decisions

### Implementation Boundary
- Update `HomeV2TrustLayer.tsx`.
- Add scoped `.home-v2-trust-*` styles only.
- Update EN/DE/FR/IT `homeV2` Trust copy only.
- Extend Home V2 E2E to assert the new Trust title and principles.
- Preserve the current `/` homepage.

### the agent's Discretion
Small spacing, order, and screenshot-driven refinements are allowed inside the Trust section.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `HomeV2TrustLayer.tsx`
- `src/styles/home-v2-premium.css`
- `tests/e2e/home-v2.spec.ts`
- EN/DE/FR/IT `homeV2.json`

### Established Patterns
- Home V2 code is isolated under `src/components/home-v2/` and `/home-v2`.

### Integration Points
- `/` remains covered by the existing E2E separation test.
</code_context>

<specifics>
## Specific Ideas

Make the change feel materially different from the previous Trust card grid.
</specifics>

<deferred>
## Deferred Ideas

Replacing `/` with Home V2 remains deferred.
</deferred>
