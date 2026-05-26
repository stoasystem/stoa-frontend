# Final Demo Overview

## Purpose

This package presents the STOA Learning Platform frontend as a stable review and launch-candidate demo. It is intended for investor presentations, parent conversations, tutor review, internal stakeholder review, and launch-candidate checks.

## What The Demo Shows

- A premium STOA public entry point and role-based account setup.
- Student learning support through chat, learning history, homework upload metadata, and teacher-help escalation.
- Professional teacher support through tutor request review and status updates.
- Parent visibility through linked child data, weekly report, recommendations, and plan context.
- Pricing, billing interest, contact, support, and operational/admin visibility.
- English, German, French, and Italian language support.

## What The Demo Does Not Show

- Production backend, production database, production authentication, or AWS deployment.
- Real payment collection, Stripe webhooks, or subscription enforcement backend.
- Real teacher verification, OCR, identity checks, or school onboarding operations.
- Real AI provider orchestration in the browser.
- Final legal, privacy, or native-speaker approval.

## Recommended Duration

- Investor demo: 10-15 minutes.
- Parent demo: 8-10 minutes.
- Student demo: 5-7 minutes.
- Tutor demo: 6-8 minutes.
- Admin/operations demo: 5-8 minutes.

## Recommended Order

1. Homepage.
2. Student chat and teacher-help request.
3. Tutor request workflow.
4. Parent report.
5. Pricing or billing path.
6. Contact/support path.
7. Admin overview.

## Services To Start

```bash
npm install
npm run demo:reset
npm run demo:backend
npm run dev -- --host 127.0.0.1
```

Use `http://127.0.0.1:5173/` for local frontend demos and `http://127.0.0.1:8000/health` for demo backend health.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student@test.com` | `password123` |
| Parent | `parent@test.com` | `password123` |
| Tutor | `tutor@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

These accounts are for internal demo operation and should not be displayed in normal user-facing UI.

## Key URLs

| Area | URL |
|------|-----|
| Homepage | `/` |
| Register | `/register` |
| Login | `/login` |
| Student chat | `/chat` |
| Student dashboard | `/dashboard` |
| Learning history | `/learning-history` |
| Parent dashboard | `/parent` |
| Parent report | `/parent/children/user-student/report` |
| Tutor requests | `/tutor/requests` |
| Pricing | `/pricing` |
| Billing | `/billing` |
| Contact | `/contact` |
| Support tickets | `/support/tickets` |
| Admin overview | `/admin` |
| Admin analytics | `/admin/analytics` |

## Backend Failure Handling

If the demo backend fails:

1. Stop and restart `npm run demo:backend`.
2. Run `npm run demo:reset`.
3. Check `http://127.0.0.1:8000/health`.
4. If the backend still fails, switch to public-page-only demo and state that authenticated role data requires the local demo backend.

## Fixed Demo Rule

Do not explore unfinished routes live. Follow the audience-specific script and move operational or placeholder concerns into known issues or next-stage backlog.

