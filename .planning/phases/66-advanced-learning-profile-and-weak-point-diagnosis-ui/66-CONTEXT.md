# Phase 66: Advanced Learning Profile and Weak-Point Diagnosis UI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Render advanced student learning profile and weak-point diagnosis using precomputed mock/API contract data. Do not implement an AI diagnosis engine.
</domain>

<decisions>
## Implementation Decisions

- Use typed learning services/hooks.
- Display diagnosis as demo output with evidence and recommendations.
- Track page view events without sending chat/support/report content.
</decisions>

<code_context>
## Existing Code Insights

Parent and student pages already use typed report/history cards and React Query hooks.
</code_context>

<specifics>
## Specific Ideas

Routes: `/students/:studentId/learning-profile`, `/organization/students/:studentId/learning-profile`, `/students/:studentId/diagnosis`.
</specifics>

<deferred>
## Deferred Ideas

AI profile generation, diagnosis scoring, model prompt orchestration.
</deferred>
