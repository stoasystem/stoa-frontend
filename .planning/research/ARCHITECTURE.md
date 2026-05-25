# Project Research - Architecture for v1.8 Phase 9

## Existing Architecture Fit

Phase 9 should preserve the current architecture:

```text
React/Vite frontend
  -> STOA HTTP API
  -> backend services
  -> production database or pilot backend database
```

The frontend must not depend on whether the backend uses SQLite, PostgreSQL, Supabase, Neon, RDS, or another store.

## New Integration Points

- App bootstrap/env utilities read `VITE_APP_ENV`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_FEEDBACK`, `VITE_ENABLE_ERROR_MONITORING`, and `VITE_ENABLE_DEMO_SHORTCUTS`.
- `AppErrorBoundary` reports sanitized runtime errors through monitoring service.
- Analytics client sends event payloads through the existing HTTP client boundary.
- Support request form sends typed support requests through a support service.
- Admin usage/feedback pages read from admin service hooks, with placeholder states until backend APIs exist.

## Data Flow

### Error Monitoring

```text
Runtime error
  -> AppErrorBoundary
  -> sanitize payload
  -> reportFrontendError()
  -> POST /monitoring/frontend-errors
```

### Analytics

```text
Product action
  -> trackEvent(name, allowedPayload)
  -> analyticsClient
  -> POST /analytics/events
```

### Support

```text
Pilot user submits support request
  -> SupportRequestForm
  -> useSubmitSupportRequestMutation
  -> submitSupportRequest()
  -> POST /support/requests or feedback-compatible backend path
```

## Build Order

1. Production/pilot documentation and environment contracts.
2. Monitoring/logging/analytics service foundations.
3. Onboarding/support/admin route surfaces.
4. Privacy/terms/pricing/billing placeholder upgrades.
5. README and launch checklist verification.
