---
status: complete
phase: 129
plan: 129
title: Blocker fixes and release lock preservation
---

# Phase 129 Plan

## Goal

Finalize and verify only the release-blocker fixes approved by Phase 128 while preserving copy, design, translation, and demo API locks.

## Tasks

- [x] Confirm each current code change maps to FAC-001 through FAC-005.
- [x] Verify four-language homepage eyebrow copy.
- [x] Verify the provided logo asset is used through `StoaLogo`.
- [x] Verify header/footer contrast changes are scoped and render in browser.
- [x] Verify public-page images use local `img/` assets with no remote image URLs.
- [x] Run build and lint.
- [x] Run browser desktop and mobile smoke checks.
- [x] Document lock preservation evidence.
- [x] Mark approval items verified after checks pass.

## Verification

- [x] `npm run build` passed.
- [x] `npm run lint` passed.
- [x] Local frontend returned HTTP 200.
- [x] Desktop browser smoke passed on `/`, `/contact`, `/pricing`, `/for-parents`, and `/teacher-support`.
- [x] Mobile browser smoke passed at 375px and 430px on `/` and `/contact`.
- [x] No demo API contract file or service contract was changed.
