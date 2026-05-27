# Phase 187: Roadmap Component System and Lesson Node States - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Build reusable roadmap components that can render lesson nodes, connectors, progress context, unlock hints, and continue cards with clear node states.
</domain>

<decisions>
## Implementation Decisions

### Component Boundary

Keep navigation decisions outside individual node styling where possible. Components should expose click callbacks and render state clearly.

### Visual Tone

Use restrained STOA premium styling: muted sage for completed/review, navy/gold emphasis for current, ivory/card surfaces for available, and neutral locked states.
</decisions>

<code_context>
## Existing Code Insights

- Practice components live in `src/components/practice`.
- Existing UI uses Tailwind utility classes, lucide icons, `Button`, and `cn`.
- Existing route helpers can be used later for integration.
</code_context>

<specifics>
## Specific Ideas

- Add `PracticeRoadmap`, `RoadmapUnitSection`, `RoadmapLessonNode`, `RoadmapConnector`, `RoadmapProgressHeader`, `RoadmapUnlockHint`, and `ContinueNextLessonCard`.
- Use fixed dimensions and responsive constraints so text and icon states do not shift layout.
- Expose locked hint behavior from `PracticeRoadmap`.
</specifics>

<deferred>
## Deferred Ideas

Page route integration, localization copy, docs, browser QA, and README updates happen in later phases.
</deferred>
