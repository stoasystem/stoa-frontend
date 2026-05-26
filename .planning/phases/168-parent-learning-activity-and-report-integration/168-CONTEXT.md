# Phase 168: Parent Learning Activity and Report Integration - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Present Practice and Chat as one parent-visible learning activity across Parent Dashboard and Parent Report.
</domain>

<decisions>
## Implementation Decisions

### Parent Framing
- Use Learning activity as the parent concept.
- Avoid failure, ranking, surveillance, or anxiety wording.

### Report Structure
- Combine lessons, questions, teacher support, and next focus.

### the agent's Discretion
Use existing parent report mock practice summary and components.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ParentDashboardPage`, `ChildReportPage`, `ParentPracticeSummaryCard`.

### Established Patterns
- Parent copy lives under `parent.json`.
- Practice parent data comes through `usePracticeParentSummaryQuery`.

### Integration Points
- Parent dashboard and child weekly report.
</code_context>

<specifics>
## Specific Ideas

Create `LearningActivitySummary` and insert it in parent overview/report.
</specifics>

<deferred>
## Deferred Ideas

Full report redesign remains out of scope.
</deferred>
