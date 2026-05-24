# Project Research: Features for v1.6 Phase 7

**Milestone:** v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness
**Date:** 2026-05-25

## Table Stakes

### UI Polish and Responsive Readiness

- Shared `PageContainer`, `PageHeader`, and `SectionHeader` patterns.
- Documented UI guidelines for containers, spacing, cards, forms, dashboards, sidebars, chat, badges, and mobile behavior.
- Main pages remain usable at 375px, 430px, 768px, and 1024px widths.
- Chat mobile view avoids a permanently visible conversation sidebar that crushes content.

### Loading and Feedback

- Skeleton components for page, dashboard, chat, parent, and tutor loading states.
- Toast feedback for login/register/profile/upload/teacher-help/tutor actions.
- User-readable inline errors where a toast alone is insufficient.

### Validation and Resilience

- Login validates email and non-empty password.
- Register validates name, email, password length, and role.
- Student profile validates grade and at least one subject.
- Chat input blocks empty sends.
- File upload keeps type, size, and count validation.
- App-level error boundary prevents full white-screen failures.

### Analytics and Usage Tracking

- `trackEvent()` supports core MVP events.
- Events are safe to log in development and can be forwarded later.
- Usage tracking API contract is documented and optionally supported by local backend.

### Parent Report

- Parent can open `/parent/children/:childId/report`.
- Report shows period, summary, stats, top subjects, weak topics, and recommendations.
- Local backend can return seed report data.

### Tutor Workflow

- Tutor request list supports status filtering.
- Request list shows grade, subject, time, summary, and priority placeholder.
- Request detail gives clearer context and supports teacher notes.

### Demo and Staging

- Demo seed data supports the full student -> tutor -> parent loop.
- Development/staging can show demo login shortcuts.
- `.env.example` includes app environment, analytics, and demo shortcut flags.
- README documents the investor/demo flow.

## Differentiators For Later

- Full product analytics dashboards.
- Real generated parent reports.
- Production observability and audit logs.
- Formal staging deployment, CI checks, and E2E coverage.
- Real feedback collection workflow for early users.

## Acceptance-Oriented Feature Groups

- Shared UI polish and responsive shell.
- Skeleton and toast feedback.
- Validation and error boundary.
- Analytics and usage tracking.
- Parent report.
- Tutor workflow polish.
- Demo/staging docs and verification.
