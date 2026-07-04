---
type: quick
status: complete
created: 2026-07-04
completed: 2026-07-04
---

# Summary

Completed a Swiss-market refresh of the Home V2 candidate image set.

## Changed

- Removed four previous Pexels candidates from local active candidates:
  - `parent-homework-living-room-pexels-8055080.jpg`
  - `learning-thread-close-study-pexels-8054838.jpg`
  - `parent-confidence-kitchen-pexels-8055125.jpg`
  - `parent-learning-laptop-pexels-9240631.jpg`
- Added seven Unsplash candidates under `img/home-v2/candidates/unsplash/`.
- Rewrote `docs/home/home-v2-image-shortlist.md` around Swiss-market fit.
- Rebuilt `docs/home/home-v2-asset-ledger.csv` with active, deferred, and removed asset states.
- Updated `.planning/STATE.md` with the new image-selection decision.

## Result

The candidate pool is now appropriate enough for Home V2 prototype work in a Swiss-first context, but the final public Hero should still use paid or commissioned Swiss/European education photography if the goal is premium private-education positioning.

## Verification

- Confirmed local JPEG dimensions with `file`.
- Confirmed active files with `find img/home-v2/candidates -type f`.
- Ran `git diff --check`.
