# Practice Route Map

## Canonical Routes

Practice uses subject/topic route identifiers so future topics can be added without changing page contracts.

```text
/practice
/practice/:subjectId/:topicId
/practice/:subjectId/:topicId/lessons/:lessonId
/practice/:subjectId/:topicId/lessons/:lessonId/result
/practice/mistakes
```

The current demo uses:

```text
/practice/mathematics/equations
/practice/mathematics/equations/lessons/lesson-linear-2
```

## Compatibility Routes

The app still accepts older subject-only Practice lesson routes while Phase 34 migration is in progress:

```text
/practice/:subjectId
/practice/:subjectId/lessons/:lessonId
/practice/:subjectId/lessons/:lessonId/result
```

These routes should be treated as compatibility paths. New links should use the subject/topic route shape.

## Component Mapping

| Route | Component | Purpose |
|-------|-----------|---------|
| `/practice` | `PracticeOverviewPage` | Student Practice overview and available topic entry. |
| `/practice/:subjectId/:topicId` | `SubjectPathPage` | Subject/topic unit and lesson path. |
| `/practice/:subjectId/:topicId/lessons/:lessonId` | `LessonPage` | Practice challenge flow. |
| `/practice/:subjectId/:topicId/lessons/:lessonId/result` | `LessonResultPage` | Lesson completion and next actions. |
| `/practice/mistakes` | `MistakesReviewPage` | Recent mistake review and Learning Chat transition. |

## Implementation Rule

Use `src/lib/practiceRoutes.ts` for new Practice links. Avoid hand-building Practice lesson URLs in components.
