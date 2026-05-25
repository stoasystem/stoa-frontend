# Launch Checklist

Use this checklist before starting the controlled Phase 9 pilot. The goal is production-like readiness for a small invited group, not a public launch.

## Production-Like Deployment

- [ ] Production or pilot frontend URL is selected and stable.
- [ ] Production or pilot backend API URL is selected and stable.
- [ ] Deployment provider builds with `npm run build` and publishes `dist`.
- [ ] SPA fallback sends deep route refreshes to `index.html`.
- [ ] Production environment uses `VITE_APP_ENV=production`.
- [ ] Production environment uses `VITE_ENABLE_DEMO_SHORTCUTS=false`.
- [ ] Production `VITE_API_BASE_URL` is HTTPS and not localhost.
- [ ] No secrets, credentials, database URLs, or private service keys are placed in `VITE_*` variables.
- [ ] `npm run build` passes.
- [ ] `npm run preview` is checked locally before deployment.

## Database and API Contract

- [ ] SQLite is limited to local development, demos, and functional tests.
- [ ] Production database choice and migrations are owned behind backend APIs.
- [ ] Backend production database backup strategy is documented.
- [ ] Pilot API contract freeze covers auth, conversations, files, teacher help, parent reports, tutor workflows, feedback, support, admin, monitoring, and analytics.
- [ ] Breaking API changes have a frontend/backend coordination issue and rollout plan.

## Monitoring

- [ ] `VITE_ENABLE_ERROR_MONITORING=true` is configured for pilot.
- [ ] Error Boundary fallback UI is verified.
- [ ] Runtime errors are reported to `/monitoring/frontend-errors` or the selected monitoring vendor.
- [ ] Error payload includes route and app environment.
- [ ] Error payload does not include passwords, tokens, full chat content, or file contents.

## Logging

- [ ] Production logging policy is reviewed.
- [ ] Development-only debug/info logging is not relied on for production support.
- [ ] Warnings/errors avoid sensitive student, auth, or file data.
- [ ] Support and bug workflows define where operational notes are recorded.

## Analytics

- [ ] `VITE_ENABLE_ANALYTICS=true` is configured for pilot.
- [ ] `POST /analytics/events` is available.
- [ ] `user_login`, `chat_message_sent`, `file_uploaded`, `teacher_help_requested`, `parent_report_viewed`, `tutor_request_status_updated`, and `feedback_submitted` can be delivered or safely ignored on failure.
- [ ] Analytics payloads exclude full chat content and file contents.
- [ ] Analytics failure does not block product flows.

## Onboarding

- [ ] `/onboarding` is reachable.
- [ ] Student onboarding explains setup and entry into Chat.
- [ ] Parent onboarding explains child dashboard and report visibility.
- [ ] Tutor onboarding explains request list, request detail, and status updates.
- [ ] Pilot invitation/account creation process is ready.

## Support

- [ ] `/support` is reachable.
- [ ] Support request or feedback-compatible submission path is available.
- [ ] Support workflow owner is assigned.
- [ ] Support triage buckets and severity expectations are documented.
- [ ] Users see pilot-stage expectations and contact guidance.

## Admin Operations

- [ ] Admin can log in.
- [ ] `/admin` is reachable.
- [ ] `/admin/usage` shows summary cards or a backend-pending placeholder.
- [ ] `/admin/feedback` shows feedback list contract or a backend-pending placeholder.
- [ ] Full user management remains deferred and not required for pilot start.

## Privacy and Terms

- [ ] `/privacy` is reachable and contains pilot data usage language.
- [ ] `/terms` is reachable and explains AI limitations and pilot status.
- [ ] Privacy review covers analytics, monitoring, feedback, support, demo data, parent visibility, and tutor visibility.
- [ ] Users are instructed not to upload highly sensitive files during pilot.
- [ ] Parent visibility and tutor visibility boundaries are explained.

## Backup and Restore

- [ ] Backend confirms backup scope for users, profiles, parent-child links, conversations, messages, teacher help, reports, feedback, and critical operational data.
- [ ] SQLite pilot fallback, if used, has a daily copy and restore command.
- [ ] Production database plan includes automated backups and point-in-time recovery if supported.
- [ ] Restore rehearsal includes frontend checks for login, conversations, parent report, and tutor requests.

## Pricing and Billing

- [ ] `/pricing` is reachable.
- [ ] `/billing` is reachable for authenticated users.
- [ ] Billing page clearly states billing is unavailable until after pilot.
- [ ] Pricing is framed as product positioning, not payment enforcement.

## Pilot Launch

- [ ] Pilot students are selected.
- [ ] Pilot parents are selected.
- [ ] Pilot tutors are selected.
- [ ] Pilot accounts are created or invite process is ready.
- [ ] Pilot instructions are prepared.
- [ ] Support channel is ready.
- [ ] Bug tracking board is ready.
- [ ] Pilot success metrics are defined.
- [ ] Post-pilot feedback report template is ready.

## Go/No-Go

Go only when:

- Automated build and lint pass.
- E2E and manual QA are either complete or explicitly scheduled before user access.
- Monitoring, analytics, feedback/support, privacy, terms, backup, and admin visibility are ready enough for the chosen pilot group.
- The team has named owners for support, bug triage, backend operations, and pilot review.

No-go if:

- Production API points at localhost.
- Demo shortcuts are enabled in production.
- Sensitive telemetry payloads are known to be sent.
- Parent or tutor visibility rules are not backend-enforced.
- Backup/restore owner and process are unknown.
