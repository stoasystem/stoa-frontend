---
phase: 42
title: Monitoring and Logging Foundation
status: complete
---

# Phase 42 Context

## Scope

Implement the frontend monitoring and logging foundation only.

Owned implementation files:
- `src/services/monitoring/`
- `src/services/logging/`
- `src/components/common/AppErrorBoundary.tsx`
- `docs/operations/error-monitoring.md`
- `docs/operations/logging.md`

Explicitly out of scope:
- Analytics pages and services
- Onboarding pages
- Support pages
- Admin pages
- Pricing pages
- Backend endpoint implementation

## Requirements

- MON-01: Provide a frontend error monitoring service.
- MON-02: Report sanitized frontend error payloads to `/monitoring/frontend-errors` through the existing HTTP client.
- MON-03: Include route and app environment in monitoring reports.
- MON-04: Do not include sensitive chat, file, password, or token data in monitoring reports.
- LOG-01: Provide an env-aware frontend logger utility.
- LOG-02: Avoid leaking sensitive payload data through logs.

## Existing Context

- The app already wraps providers and routing with `AppErrorBoundary`.
- The existing app HTTP client is `src/services/api/httpClient.ts`.
- App environment helpers live in `src/lib/env.ts`.
- `AppErrorBoundary` currently uses `react-error-boundary` and renders a simple fallback UI.

## Decisions

- Keep monitoring disabled by default in development and enabled in staging/production unless explicitly disabled.
- Use a client-side redaction allowlist and bounded strings to avoid transmitting arbitrary application state.
- Never let monitoring failures throw from the error boundary path.
- Keep logger output development-oriented; suppress debug/info in production and redact object payloads before console output.
