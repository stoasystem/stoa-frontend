# Demo Monitoring Plan

**Release:** STOA Learning Platform public demo release
**Date:** 2026-05-26

## What To Monitor

| Area | Check | Failure response |
|------|-------|------------------|
| Frontend availability | Open public frontend URL and confirm homepage renders. | Roll back or redeploy previous build. |
| Login | Student, parent, tutor, and admin demo accounts can sign in. | Check API base URL and auth endpoint health. |
| Chat | Student can open chat and send a question. | Check conversation/message endpoints and frontend token state. |
| Teacher support | Student can request teacher support and tutor can see/resolve the request. | Check teacher-help endpoints and reset data if needed. |
| Parent report | Parent can open linked child report. | Check parent child/report endpoints. |
| Pricing | Pricing page renders and billing path does not imply live payment collection. | Check feature flags and copy. |
| Contact form | Contact submission returns success. | Check `/contact/requests` and form validation. |
| Mobile | Homepage, register, chat, parent report, pricing, and contact have no horizontal overflow at 375px/430px. | Triage as release blocker if severe. |
| User-visible artifacts | No visible mock/test/Codex/internal debug language appears in public-facing UI. | Hide or rollback immediately. |

## First 48 Hours

Run once per day:

- Homepage open.
- Login with student account.
- Student chat send.
- Parent report open.
- Tutor queue open.
- Contact form submit.
- Pricing page open.
- Mobile 375px homepage/contact smoke.

## Before Important Presentations

Run 30-60 minutes before the session:

- Confirm frontend URL.
- Confirm API health.
- Reset data only if the presentation needs a clean dataset.
- Login as student, parent, tutor, and admin.
- Send one student question.
- Submit one teacher-support request.
- Confirm tutor can see the request.
- Confirm parent report loads.
- Confirm contact form submits.
- Set browser zoom to 100%.
- Set language to the planned presentation language.

## Reporting Format

Record each check with:

- Date/time.
- Tester.
- Environment URL.
- Browser/device.
- Result.
- Issue ID if failed.
- Workaround or rollback decision.

