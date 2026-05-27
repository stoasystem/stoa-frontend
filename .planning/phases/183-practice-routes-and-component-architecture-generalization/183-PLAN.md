# Phase 183 Plan

## Steps

1. Add canonical topic routes for Practice topic, lesson, and result pages.
2. Keep legacy subject-only routes for compatibility during migration.
3. Add a shared Practice route helper for component links.
4. Update overview, subject card, lesson node, dashboard, result, mistake review, and lesson flow links.
5. Update route inventory and route documentation.
6. Run `npm run build`.

## Verification

- New links should generate `/practice/:subjectId/:topicId/...`.
- Existing `/practice` and legacy subject-only routes should remain registered.
- Build must pass.
