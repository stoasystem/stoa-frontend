---
status: complete
---

# Quick Task Summary: Remove Duplicate Homepage Flow

**Completed:** 2026-05-27

## Changes

- Removed the duplicate `Platform hierarchy` flow section from the homepage.
- Deleted the now-unused `HomeLearningJourney` component.
- Removed the unused `journey` copy from English, German, French, and Italian homepage locale files.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- Browser check on `/`: `Platform hierarchy` is no longer present.
