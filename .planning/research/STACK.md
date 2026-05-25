# Project Research - Stack for v1.8 Phase 9

## Scope

Research focused on production readiness, monitoring, analytics delivery, support workflows, privacy review, backup/restore coordination, and pilot launch preparation for the existing React + TypeScript + Vite STOA frontend.

## Findings

- Vite exposes only variables prefixed with `VITE_` to browser code, and those values are bundled into client assets. Phase 9 production env variables must be treated as public configuration, never secrets.
- Vercel supports Vite deployments and environment-specific variables. STOA should document production and preview/staging values separately so pilot users do not hit localhost or staging-only APIs by accident.
- Error monitoring can start with either Sentry or a backend endpoint such as `POST /monitoring/frontend-errors`. For this milestone, a wrapper service keeps the frontend independent from the eventual vendor.
- Sentry's JavaScript SDK can collect runtime errors and contextual data; configuration must avoid sending default PII unless explicitly approved by the privacy policy.
- Analytics can remain a thin frontend client that posts event name, allowed metadata, and timestamp to `POST /analytics/events`. This avoids vendor lock-in while creating a stable backend collection contract.
- PostgreSQL backup and restore planning should account for base backups plus WAL/continuous archiving when point-in-time recovery is required. If the pilot backend remains SQLite-like, the backup process must explicitly describe database-file copies and restore rehearsal.

## Recommended Stack Additions

- `src/services/monitoring/errorMonitoringApi.ts` for frontend error reporting.
- `src/services/logging/logger.ts` for environment-aware logging.
- `src/services/support/supportApi.ts` for support request submission.
- `src/services/admin/adminApi.ts` for usage and feedback placeholder contracts.
- Continue using TanStack Query for admin/support mutations and queries.
- Keep analytics vendor-neutral through the existing analytics client until the backend selects a durable analytics store or third-party vendor.

## Sources

- Vite Env Variables and Modes: https://vite.dev/guide/env-and-mode/
- Vercel Vite framework docs: https://vercel.com/docs/frameworks/frontend/vite
- Sentry JavaScript data collection docs: https://docs.sentry.io/platforms/javascript/guides/remix/data-management/data-collected
- PostgreSQL continuous archiving and PITR docs: https://www.postgresql.org/docs/17/continuous-archiving.html
