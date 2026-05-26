# Phase 167: Student Dashboard and Practice-to-Chat Flow - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Practice and Learning Chat clear student entry points, improve Practice-to-Chat context, and preserve Back to lesson.
</domain>

<decisions>
## Implementation Decisions

### Dashboard
- Continue Practice should be the leading learning entry.
- Learning Chat should be the explanation center for specific questions.

### Practice Flow
- Wrong answers offer hint and Explain this step.
- Teacher support appears after repeated confusion.
- Lesson results offer continue, review mistakes, and review with Learning Chat.

### the agent's Discretion
Reuse existing route-state Practice context instead of adding backend persistence.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `LessonPage`, `ChallengeFeedback`, `HintPanel`, `PracticeContextCard`, `LessonResultSummary`.

### Established Patterns
- Practice-to-Chat already uses React Router state.
- Demo/mock contracts live under `src/types/practice.ts`.

### Integration Points
- Student dashboard components, Practice lesson components, Chat page.
</code_context>

<specifics>
## Specific Ideas

Add dedicated dashboard entry cards and CTA components.
</specifics>

<deferred>
## Deferred Ideas

Persisted backend Practice-to-Chat context remains future work.
</deferred>
