# Phase 83: Teacher Help, Tutor Handling, and Parent Report APIs - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Close the cross-role learning support loop for student, tutor, and parent demos.

</domain>

<decisions>
## Implementation Decisions

Reuse existing teacher-help and parent endpoints. Fill the missing monthly report placeholder and ensure seeded data contains pending, assigned/in-progress, and resolved tutor states.

</decisions>

<code_context>
## Existing Code Insights

Teacher-help create/list/detail/status and parent children/summary/history/weekly report already existed. Monthly report endpoint was missing.

</code_context>

<specifics>
## Specific Ideas

Add `/parents/me/children/:childId/monthly-report` as a demo placeholder derived from weekly report data.

</specifics>

<deferred>
## Deferred Ideas

Real AI-generated reports and production tutor routing remain out of scope.

</deferred>

