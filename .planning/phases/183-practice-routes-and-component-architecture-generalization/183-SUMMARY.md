# Phase 183 Summary: Practice Routes

## Completed

- Added canonical subject/topic Practice routes:
  - `/practice/:subjectId/:topicId`
  - `/practice/:subjectId/:topicId/lessons/:lessonId`
  - `/practice/:subjectId/:topicId/lessons/:lessonId/result`
- Kept legacy subject-only routes registered for compatibility.
- Added `src/lib/practiceRoutes.ts` so Practice links are generated from typed helpers.
- Updated Practice overview, subject cards, lesson nodes, dashboard Practice CTA, lesson flow, lesson result, and mistake review links to use subject/topic URLs.
- Updated subject path query keys and API call shape to support topic paths.
- Added `docs/practice/practice-route-map.md`.

## Boundary

This phase intentionally kept user-facing copy changes small. Full homepage/dashboard/Practice copy cleanup remains Phase 184.
