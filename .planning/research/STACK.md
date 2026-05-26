# Phase 23 Research: Stack and Tooling

**Milestone:** v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release
**Date:** 2026-05-26

## Existing Stack

Phase 23 should not add stack surface. The release candidate already uses:

- React, TypeScript, Vite, npm.
- React Router for route surfaces.
- TanStack Query and Axios for API-backed flows.
- Zustand for auth/UI state.
- FastAPI local demo backend for repeatable demo flows.
- Playwright for E2E and browser smoke checks.
- Existing i18n with English, German, French, and Italian locale JSON files.

## Recommended Stack Changes

None.

Bug cleanup should use the existing project tooling:

- `npm run build` for TypeScript and production bundle verification.
- `npm run lint` where bug fixes touch lint-sensitive source.
- `npm run demo:reset` and `npm run demo:backend` for local demo data/backend checks.
- `npm run test:e2e` when changes touch route or flow behavior covered by existing E2E smoke tests.
- Browser/manual checks for visual, responsive, language, and accessibility smoke evidence.

## Release Environment Notes

Public demo release should preserve these environment expectations:

- `VITE_API_MODE=demo` or approved public-demo API mode.
- `VITE_API_BASE_URL` points to the demo backend or approved backend endpoint.
- `VITE_SHOW_DEMO_ACCOUNTS=false`.
- `VITE_SHOW_DEMO_BADGES=false`.
- `VITE_SHOW_INTERNAL_DEBUG=false`.

## What Not To Add

- No new dependencies for release hygiene unless a P0 blocker cannot be solved without one.
- No new test framework.
- No new backend framework.
- No new translation service.
- No new UI library.
- No new monitoring vendor integration in this milestone.

