# Phase 183 Context: Practice Routes

## Inputs

- Phase 182 added subject/topic metadata to the Practice model.
- Existing routes used `/practice/:subjectId` and `/practice/:subjectId/lessons/:lessonId`.
- The milestone requires topic-level architecture such as `/practice/:subjectId/:topicId` while preserving existing entry behavior.

## Boundary

This phase updates route structure and link generation. User-facing copy cleanup remains Phase 184.
