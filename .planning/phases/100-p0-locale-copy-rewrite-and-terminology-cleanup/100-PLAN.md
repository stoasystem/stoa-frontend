# Phase 100: P0 Locale Copy Rewrite and Terminology Cleanup - Plan

**Status:** Ready
**Requirements:** HERO-01, HERO-02, HERO-03, HERO-04, P0COPY-01 through P0COPY-08, TERM17-01 through TERM17-06

## Tasks

1. Rewrite homepage hero and P0 section copy in EN/DE/FR/IT.
2. Refine auth, chat, parent, tutor, pricing, billing, support, error, toast, empty, and loading copy where needed.
3. Add localized billing plan display keys and update `PlanCard` to prefer locale copy.
4. Clean user-visible banned terminology and obvious grep false positives.
5. Verify typecheck and terminology search.

## Verification

- `npx tsc -b --pretty false`
- `rg` audit for banned user-visible terminology in P0 source paths.
