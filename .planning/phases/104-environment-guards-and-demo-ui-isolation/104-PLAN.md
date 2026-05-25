---
plan_id: 104-01
phase: 104
phase_name: Environment Guards and Demo UI Isolation
status: planned
---

# Plan 104-01: Demo Visibility Guards

## Goal

Make demo-only UI opt-in for local/demo contexts while keeping normal production-facing UI clean.

## Tasks

1. Extend `src/lib/env.ts` with production-facing app-env detection and semantic `show*` flags.
2. Add `src/lib/demoVisibility.ts` for a single visibility decision boundary.
3. Gate login demo account shortcuts with `showDemoAccounts`.
4. Gate demo navigation with `showDemoSurfaces`.
5. Gate organization and advanced demo routes with `DemoSurfaceRoute`.
6. Gate checkout preview behavior with `showCheckoutPreview`.
7. Add a development-only `InternalDebugPanel`.
8. Update `.env.example` with the new explicit flags.
9. Verify TypeScript/build.

## Verification

- `npm run build` passes.
- Demo account shortcuts, demo nav, checkout preview, and internal debug UI are hidden by default unless explicit non-production flags enable them.
- Production-facing and staging-pilot modes force demo visibility off.
