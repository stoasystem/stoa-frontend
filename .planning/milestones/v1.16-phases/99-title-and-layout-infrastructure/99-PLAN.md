# Phase 99: Title and Layout Infrastructure - Plan

**Status:** Ready
**Requirements:** HERO-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04

## Tasks

1. Add a typed `localeLayout` helper for `en`, `de`, `fr`, and `it`.
2. Add safe optional `titleLines` normalization in `HomeHero`.
3. Apply locale-specific hero title variant and width/action hints without moving copy into layout config.
4. Add scoped CSS for stacked hero title rhythm.
5. Verify TypeScript build or typecheck for the changed files.

## Verification

- `npx tsc -b --pretty false`
- Source inspection confirms `HomeHero` still falls back to `home.hero.title`.
