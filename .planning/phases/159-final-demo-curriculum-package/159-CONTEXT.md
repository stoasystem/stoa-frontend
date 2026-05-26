# Phase 159: Final Demo Curriculum Package - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Mode:** Auto-generated from roadmap because `workflow.skip_discuss=true`

<domain>
## Phase Boundary

Phase 159 packages the existing equation-focused Practice Path demo into a final curriculum bundle. It does not add lessons, routes, backend behavior, or new UI mechanics.

The package should make the demo easy to explain externally:
- Subject: Mathematics
- Theme: Equations
- Grade level: lower secondary
- Units: linear equations in one variable, simple quadratic equations, and linear systems in two variables
- Flow: Practice -> mistake -> hint -> Learning Chat -> teacher support if needed -> Parent Report

</domain>

<decisions>
## Implementation Decisions

- Keep all work in documentation under `docs/curriculum/final-demo-curriculum-package/`.
- Use existing Phase 27-29 Practice docs as source context.
- State exclusions directly so the demo is not mistaken for a complete math curriculum.
- Use parent- and teacher-understandable language, not internal implementation terms.

</decisions>

<code_context>
## Existing Code Insights

The codebase already contains the frontend/demo Practice Path, equation mock content, Practice-to-Chat handoff, teacher escalation, and parent learning activity summary. This phase documents that surface rather than modifying it.

</code_context>

<specifics>
## Specific Outputs

- `overview.md`
- `equation-path-summary.md`
- `linear-equation-demo.md`
- `quadratic-equation-demo.md`
- `linear-system-demo.md`
- `practice-to-chat-flow.md`
- `practice-to-teacher-support-flow.md`
- `parent-report-learning-summary.md`
- `demo-limitations.md`
- `future-curriculum-requirements.md`

</specifics>

<deferred>
## Deferred Ideas

Real curriculum expansion, formal content CMS, backend persistence, and adaptive learning remain outside Phase 159.

</deferred>
