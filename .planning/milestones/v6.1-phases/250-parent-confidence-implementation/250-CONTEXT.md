# Phase 250: Parent Confidence Implementation - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the redesigned Parent Confidence section in `/home-v2` only.
</domain>

<decisions>
## Implementation Decisions

### Code Changes
- Update `HomeV2ParentConfidence.tsx`.
- Add scoped parent-confidence styles in `home-v2-premium.css`.
- Update EN/DE/FR/IT `homeV2.json` copy.
- Add a focused E2E assertion for the new parent note.

### Boundaries
- Do not change `/`.
- Do not change auth, registration, quota, backend, or role-dashboard behavior.
- Do not add dependencies.

### the agent's Discretion
Use the smallest scoped CSS change set that achieves the visual contract.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Home V2 image and visual frame components.

### Established Patterns
- Components use Tailwind utility classes plus scoped CSS for Home V2 motion/details.
- Locale files are flat JSON objects under `homeV2`.

### Integration Points
- `tests/e2e/home-v2.spec.ts` verifies route isolation and section rendering.
</code_context>

<specifics>
## Specific Ideas

Use title/body/note copy that directly expresses calm parent reassurance.
</specifics>

<deferred>
## Deferred Ideas

Trust/Assurance redesign is v6.2.
</deferred>
