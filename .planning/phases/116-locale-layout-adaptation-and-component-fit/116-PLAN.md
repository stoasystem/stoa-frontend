# Phase 116 Plan

## Goal

Keep Phase 20 copy stable in existing UI surfaces through minimal locale-aware layout hints.

## Tasks

1. Extend `localeLayout` with CTA label and button fit hints.
2. Use short mobile CTA labels where locale text can crowd buttons.
3. Keep German hero stacked and add safer hyphenation behavior.
4. Update homepage CTA components without changing product behavior.
5. Run a production build to catch TypeScript/component regressions.

## Verification

- `npm run build` passes.
- Component changes are limited to homepage CTA rendering and layout hints.

