---
status: complete
completed: "2026-05-27"
task: "Make Practice subject selection real"
---

# Summary

Made Practice subject selection real instead of effectively fixed to Mathematics.

## Changes

- Added Physics, Chemistry, and English subject options to the Practice overview.
- Added coming-later topics for non-Mathematics subjects.
- Prevented unavailable subjects from loading the Mathematics roadmap.
- Kept Mathematics as the only available demo path.
- Ensured Math-specific Practice Path, current lesson, roadmap, and review content appear only after Mathematics is selected.

## Verification

- `npm run lint`
- `npm run build`
- Playwright checked initial `/practice` has subject choices but no Math path content.
- Playwright checked Mathematics selection shows roadmap/current lesson.
- Playwright checked Physics selection shows prepared-state copy without Math roadmap.
- Playwright checked mobile initial layout has no horizontal overflow.
