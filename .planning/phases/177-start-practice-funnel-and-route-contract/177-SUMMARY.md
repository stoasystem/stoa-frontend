# Phase 177: Start Practice Funnel and Route Contract - Summary

**Completed:** 2026-05-27
**Status:** Complete

## Delivered

- Added `getStartPracticePath` and `startPracticeNavigation` in `src/lib/navigation.ts`.
- Updated `HomePracticeEntry` to use current auth state and the shared Start Practice route helper.
- Updated login redirect handling so safe role-owned `next` paths can be honored, including student `/practice`.
- Protected non-student roles from being redirected into student-only Practice through `next=/practice`.

## Route Contract

| User state | Start Practice destination |
|------------|----------------------------|
| Unauthenticated | `/login?next=/practice` |
| Student | `/practice` |
| Parent | `/parent` |
| Tutor | `/tutor` |
| Admin | `/admin` |
| Organization roles | `/organization` |

## Verification

- `npm run build`: passed.

## Notes

- Registration route documentation is tracked for Phase 180.
- The full visual Practice entry component split remains Phase 178 scope.
