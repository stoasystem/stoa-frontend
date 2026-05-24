# Production Readiness Plan

Phase 8 does not launch production. It defines the remaining work before a pilot launch.

## Before Production

- Select production hosting and domains.
- Deploy production backend and database.
- Replace local SQLite-only test persistence with production backend persistence.
- Confirm auth hardening plan.
- Disable demo shortcuts in production.
- Add error monitoring and uptime checks.
- Add backup and restore plan.
- Finalize privacy policy and terms with legal review.
- Define support workflow and response ownership.
- Confirm pilot group and onboarding process.

## Pilot Launch Entry Criteria

- Staging demo flow succeeds.
- CI is green on main.
- E2E smoke tests pass locally or in CI.
- Manual QA checklist is complete.
- Feedback workflow is active.
- Security checklist is complete.
- Privacy and terms placeholders are replaced or approved for pilot use.

## Open Decisions

- Production hosting provider.
- Production backend API URL.
- Auth token storage strategy.
- Analytics provider or backend analytics dashboard.
- Support inbox/tooling.
