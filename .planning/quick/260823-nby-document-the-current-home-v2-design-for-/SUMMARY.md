---
quick_id: 260823-nby
title: Document the current Home V2 design for collaborators
status: complete
date: 2026-08-23
---

# Summary

## Delivered

- Added `docs/home-v2/design-brief-for-collaborators.md` as the current, source-linked explanation of the Home V2 design.
- Documented the parent-facing narrative, typography roles, porcelain/mist palette, framed layout, scroll-responsive guided background, restrained motion, four runtime languages, imagery role, implementation map, and collaboration guardrails.
- Recorded that the current router maps Home V2 to `/`, while older v8/v9 documents still describe the previous `/home-v2` preview route.
- Updated `.planning/STATE.md` with the completed documentation task.

## Verification

- `git diff --check` passed.
- Confirmed `AppRouter.tsx` maps `/` to `HomeV2Page`.
- Confirmed the report includes all planned design sections and references the current entry page, router, style sheet, English copy, and locale configuration.

## Scope

No runtime or visual code changed. `public/mockServiceWorker.js` was already untracked and was not modified or staged.
