# Phase 85 Plan: Frontend API Mode and Service Layer Alignment

## Goal

Keep the frontend decoupled from demo backend internals and ready to switch API modes.

## Tasks

- [x] Add `VITE_API_MODE`, `VITE_API_BASE_URL`, and `VITE_ENABLE_MSW` examples.
- [x] Export `apiMode`, `apiBaseUrl`, `enableMSW`, and `allowDemoFallback` from `src/lib/env.ts`.
- [x] Route shared API client through centralized `apiBaseUrl`.
- [x] Gate demo fallback and auth fallback by explicit mock/demo configuration.
- [x] Remove direct API base URL reads outside `src/lib/env.ts`.
- [x] Audit page/component/hook API usage.

## Verification

- [x] `npx tsc -b --pretty false` passes.
- [x] `rg` confirms `VITE_API_BASE_URL`, `VITE_API_MODE`, `VITE_ENABLE_MSW`, and `VITE_ENABLE_DEMO_API` direct reads are centralized in `src/lib/env.ts`.
- [x] Audit confirms API calls remain in services, not page components.

