# Reorganize Practice Overview Layout Summary

## Status

Complete.

## Changes

- Reorganized `/practice` so the initial view shows subject selection plus daily goal and study streak.
- Added local subject selection state before loading path-specific roadmap content.
- Moved Practice Path, current lesson, roadmap, and review work behind the selected subject state.
- Kept existing Practice data, lesson routes, roadmap interactions, and review links intact.

## Verification

- `npm run lint`
- `npm run build`
- Browser check on `/practice` after student sign-in at 1280x900 and 390x900.
- Verified initial view shows subject, Today, Daily goal, and Study streak but not selected path/current lesson/review.
- Verified selecting Mathematics reveals Practice Path, Current lesson, roadmap units, and Review work with no horizontal overflow.
