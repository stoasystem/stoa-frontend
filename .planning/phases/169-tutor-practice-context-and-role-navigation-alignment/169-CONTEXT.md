# Phase 169: Tutor Practice Context and Role Navigation Alignment - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose Practice-origin request context for tutors and align role navigation labels.
</domain>

<decisions>
## Implementation Decisions

### Tutor Context
- Show Source: Practice lesson when available.
- Include topic, question, answer, attempts, and hint viewed state.

### Wording
- Say the student requested support after practising this step.
- Do not say the game failed.

### the agent's Discretion
Extend mock tutor detail data and frontend types.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TutorHelpRequestDetailPage`, `HelpRequestDetailCard`, tutor mock data.

### Established Patterns
- Tutor detail uses cards and dashboard layout.

### Integration Points
- `TutorHelpRequestDetail` type and `phase11MockData`.
</code_context>

<specifics>
## Specific Ideas

Add `PracticeRequestContextCard` above the transcript.
</specifics>

<deferred>
## Deferred Ideas

Backend-owned persisted teacher request context remains future work.
</deferred>
