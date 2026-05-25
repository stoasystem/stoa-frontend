# Research Summary: STOA Frontend v1.8 Phase 9

## Stack Additions

- Vendor-neutral monitoring wrapper using `POST /monitoring/frontend-errors`, with optional Sentry integration later.
- Environment-aware logger service.
- Real analytics event delivery to `POST /analytics/events`.
- Support and admin service boundaries for pilot operations.
- Production/pilot documentation for env vars, deployment, backup/restore, privacy, support, and launch.

## Feature Table Stakes

- Production deployment and environment variable plan.
- SQLite-to-production database boundary and pilot API contract freeze.
- Error monitoring and privacy-safe logging.
- Analytics delivery that avoids full chat/file content.
- Pilot onboarding, support entry, and basic admin usage/feedback routes.
- Privacy/terms pilot drafts, backup/restore docs, pricing/billing placeholders, launch checklist, and feedback report template.

## Watch Out For

- `VITE_` variables are public browser configuration, not secrets.
- Monitoring tools can collect contextual data; keep PII disabled unless policy and backend support are ready.
- Backup strategy is a backend responsibility, but frontend restore checks must be documented.
- Do not expand Phase 9 into full public launch, payment, CRM, school onboarding, or full compliance certification.

## Sources

- Vite Env Variables and Modes: https://vite.dev/guide/env-and-mode/
- Vercel Vite framework docs: https://vercel.com/docs/frameworks/frontend/vite
- Sentry JavaScript data collection docs: https://docs.sentry.io/platforms/javascript/guides/remix/data-management/data-collected
- PostgreSQL continuous archiving and PITR docs: https://www.postgresql.org/docs/17/continuous-archiving.html
