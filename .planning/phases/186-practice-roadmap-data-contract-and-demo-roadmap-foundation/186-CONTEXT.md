# Phase 186: Practice Roadmap Data Contract and Demo Roadmap Foundation - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Practice needs a subject-agnostic roadmap data layer for Mathematics / lower secondary / equations demo content without locking the product to equations.
</domain>

<decisions>
## Implementation Decisions

### Use Existing Practice Boundaries

Extend `src/types/practice.ts`, `src/data/mockPractice.ts`, `src/services/practice/practiceApi.ts`, and Practice query hooks. Do not introduce a separate feature architecture.

### Roadmap Is Separate From Challenge Lessons

Keep existing `PracticeLesson` and `LearningUnit` behavior for lesson execution. Add roadmap-specific types so lesson-node state can express current, available, locked, completed, and review without rewriting existing challenge data.
</decisions>

<code_context>
## Existing Code Insights

- Existing Practice data is already generalized to subject, grade level, topic, unit, lesson, and challenge.
- Current demo seed data lives under Mathematics / lower secondary / equations.
- Services use `withPracticeDemo` to fall back to mock data.
- Query keys are centralized in `src/services/practice/practiceQueryKeys.ts`.
</code_context>

<specifics>
## Specific Ideas

- Add `RoadmapLessonStatus`, `PracticeRoadmapTopic`, `PracticeRoadmap`, `PracticeRoadmapUnit`, and `PracticeRoadmapLesson`.
- Add `getMockPracticeRoadmap(subjectId, topicId)`.
- Add `getPracticeRoadmap(subjectId, topicId)` and `usePracticeRoadmapQuery`.
- Update mock lesson completion to mutate demo roadmap state enough to show progression.
</specifics>

<deferred>
## Deferred Ideas

Production backend persistence, formal curriculum CMS, adaptive recommendation algorithms, and new subjects remain deferred.
</deferred>
