# Phase 67: Curriculum Graph and Topic Detail UI - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Visualize static mock curriculum topic relationships. Do not implement a graph engine or dependency computation.
</domain>

<decisions>
## Implementation Decisions

- Start with custom SVG/card graph, not React Flow.
- Keep graph data typed and precomputed.
- Selecting a topic updates local UI state and analytics only.
</decisions>

<code_context>
## Existing Code Insights

No graph dependency exists. Phase 12 research recommended custom SVG first.
</code_context>

<specifics>
## Specific Ideas

Routes: `/curriculum-graph`, `/students/:studentId/curriculum-graph`.
</specifics>

<deferred>
## Deferred Ideas

React Flow, graph database, curriculum computation.
</deferred>
