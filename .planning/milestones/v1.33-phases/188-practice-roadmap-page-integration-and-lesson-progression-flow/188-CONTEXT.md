# Phase 188: Practice Roadmap Page Integration and Lesson Progression Flow - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Students should be able to use the roadmap from `/practice` and the topic page to continue, start, review, and progress through available demo lessons.
</domain>

<decisions>
## Implementation Decisions

### Canonical Topic Page

Add `TopicRoadmapPage` for `/practice/:subjectId/:topicId` and keep `SubjectPathPage` as a compatibility surface for subject-only routes.

### Navigation

Roadmap nodes route to the existing lesson pages for current, available, completed, and review states. Locked state remains in the roadmap component and shows the unlock hint.
</decisions>

<code_context>
## Existing Code Insights

- `getPracticeLessonPathFromIds` can build paths from roadmap lesson IDs.
- `useCompleteLessonMutation` invalidates all Practice queries, so mock roadmap state can refresh after completion.
- `/practice/:subjectId/:topicId` already exists in the router.
</code_context>

<specifics>
## Specific Ideas

- Use `usePracticeRoadmapQuery('mathematics', 'equations')` on `/practice`.
- Use route params in `TopicRoadmapPage`.
- Render `PracticeRoadmap` in both overview and topic route contexts.
</specifics>

<deferred>
## Deferred Ideas

Deeper post-completion feedback and parent visibility refinements are left for Phase 36.
</deferred>
