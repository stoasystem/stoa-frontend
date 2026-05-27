# Phase 188 Plan: Practice Roadmap Page Integration and Lesson Progression Flow

## Goal

Integrate the roadmap into `/practice` and canonical topic routes with usable current, available, completed, locked, and review behavior.

## Tasks

1. Add `TopicRoadmapPage`.
2. Update router to use `TopicRoadmapPage` for canonical topic routes.
3. Load roadmap data on `/practice` and pass it into the overview component.
4. Route roadmap lesson clicks to existing lesson routes.
5. Confirm mock lesson completion can refresh roadmap state through existing query invalidation.

## Verification

- `npm run build` must pass.
- ROAD35-01 through ROAD35-07 and NODE35-02 through NODE35-04, NODE35-09 must be covered.
