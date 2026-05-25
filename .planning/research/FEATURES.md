# Project Research - Features for v1.8 Phase 9

## Table Stakes

### Production Readiness

- Production frontend URL and API URL documented.
- Production environment variable plan documented.
- Demo shortcuts disabled in production.
- SQLite explicitly limited to local/demo/test usage.
- Pilot API contract freeze documented.
- Build and preview commands remain the launch gate.

### Monitoring and Logging

- Error Boundary reports production runtime errors.
- Error payload includes route, app environment, user role, and timestamp.
- Logger avoids noisy production console output and never records passwords, tokens, files, or full chat content.
- Monitoring failure must not break core user flows.

### Analytics

- Frontend analytics posts to a stable `POST /analytics/events` endpoint when enabled.
- Payloads contain event metadata but not full student chat content or file contents.
- Failure to send analytics is non-blocking.

### Pilot Onboarding and Support

- `/onboarding` explains student, parent, and tutor next steps.
- `/support` gives pilot users a support path.
- Support request submission uses a service boundary even if the backend later reuses feedback storage.

### Admin Operations

- `/admin` remains minimal but useful for pilot operation.
- `/admin/usage` shows active users and core usage counters when available.
- `/admin/feedback` shows feedback placeholder/list contract.

### Privacy, Backup, and Launch Docs

- `/privacy` and `/terms` move from placeholders to pilot drafts.
- Backup/restore docs define frontend restore checks.
- Pilot launch plan and feedback report template exist.
- Launch checklist defines go/no-go criteria.

## Differentiators Deferred

- Full observability platform with traces, replay, uptime alerts, and dashboards.
- Full support CRM.
- Full admin user management.
- Production payment and subscription enforcement.
- School multi-tenant onboarding.
- Legal-reviewed privacy/terms package.

## Complexity Notes

Most Phase 9 work is thin integration and documentation. The riskiest areas are privacy-safe telemetry, making production flags unambiguous, and keeping pilot workflows useful without building large admin/support products prematurely.
