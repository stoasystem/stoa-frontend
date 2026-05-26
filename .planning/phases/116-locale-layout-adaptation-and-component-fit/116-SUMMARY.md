---
status: complete
---

# Phase 116 Summary

Phase 116 added targeted locale layout adaptation for refined copy.

## Completed

- Added `ctaLabelVariant` and `ctaButtonClassName` to `src/lib/localeLayout.ts`.
- Enabled short mobile `startLearning` CTA labels across locales.
- Added wider CTA button hints for German, French, and Italian.
- Kept German stacked hero and added `hyphens-auto` to the German hero title class.
- Updated `HomeHero` and `HomeCTASection` to render full CTA labels on larger screens and short labels on mobile.

## Verification

- `npm run build` passed.

