# Practice Scope Migration Note

## What Changed

Practice Path is now explicitly modeled as a general learning challenge system:

```text
Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge
```

The current demo content remains:

```text
Practice Path -> Mathematics -> Lower Secondary -> Equations
```

## Canonical Identifiers

Use these identifiers for the current demo package:

```text
subjectId: mathematics
gradeLevel: lower_secondary
topicId: equations
```

The old `math` subject id is tolerated only as a compatibility alias in mock lookup. New code should use `mathematics`.

## Routes

Use subject/topic routes for new Practice links:

```text
/practice/:subjectId/:topicId
/practice/:subjectId/:topicId/lessons/:lessonId
/practice/:subjectId/:topicId/lessons/:lessonId/result
```

Use `src/lib/practiceRoutes.ts` instead of hand-building Practice lesson URLs.

## Copy Rule

Use `Practice Path`, `Guided practice`, and `school topics` for product-level copy.

Use `Mathematics / Equations` only as current available demo content.

Do not write user-facing or developer-facing copy that implies Practice Path equals equations.
