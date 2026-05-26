# Public Demo Final Run

**Date:** 2026-05-26
**Commit hash under test:** `2831d5f`
**Environment:** local public demo candidate
**Tester:** Codex local verification
**Browser:** Playwright Chromium headless plus API smoke through local Node fetch
**Devices / widths:** desktop 1280px; responsive smoke at 375px, 430px, 768px, 1024px, and 1440px
**Languages:** English, German, French, Italian

## Environment Setup

| Check | Result | Evidence |
|-------|--------|----------|
| Demo data reset | Passed | `npm run demo:reset` returned `Reset local STOA demo database`. |
| Demo backend startup | Passed | `npm run demo:backend` started on `http://127.0.0.1:8000`. |
| Demo backend health | Passed | `GET /health` returned `{"ok":true,"service":"stoa-demo-backend","mode":"demo"}`. |
| Frontend startup | Passed | `GET http://127.0.0.1:5173/` returned HTTP 200. |
| Demo accounts | Passed | Student, parent, tutor, and admin demo logins succeeded. |
| Build | Passed | `npm run build` completed successfully. |
| Lint | Passed | `npm run lint` completed successfully during Phase 129 verification. |

## Demo Account Results

| Role | Email | Result |
|------|-------|--------|
| Student | `student@test.com` | Login returned Anna Keller. |
| Parent | `parent@test.com` | Login returned Martin Keller. |
| Tutor | `tutor@test.com` | Login returned Dr. Lena Vogt. |
| Admin | `admin@test.com` | Login returned STOA Admin. |

## Core Flow Results

| Flow | Result | Evidence |
|------|--------|----------|
| Homepage -> Start learning | Passed | Homepage rendered in browser with approved hero copy and no broken images. |
| Register as student | Passed | `POST /auth/register` created a unique student account for the final run. |
| Student chat -> ask question | Passed | Student conversation list returned 3 conversations; `POST /conversations/:id/messages` returned student and assistant messages. |
| Learning Assistant response | Passed | Message API returned `assistantMessage`. |
| Request professional teacher support | Passed | `POST /teacher-help/request` returned request `teacher-request-4570f2d0-7517-4fde-8a88-e025d303db63`. |
| Tutor login and request detail | Passed | Tutor request list returned 5 requests; detail returned request, student, messages, and notes keys. |
| Tutor mark request resolved | Passed | `PATCH /tutors/me/help-requests/:requestId` returned status `resolved`. |
| Parent login and child report | Passed | Parent children returned Anna Keller; report returned summary, stats, subjects, weak topics, recommendations, and generated date. |
| Pricing / billing flow | Passed | Billing plans returned 4 plans; checkout session returned `/billing/success?plan=family`. |
| Contact form submission | Passed | `POST /contact/requests` returned `ok: true` and a contact request ID. |
| Admin overview | Passed | Admin analytics returned user, message, file, teacher-help, report, checkout, and subscription metrics. |

## Multilingual Smoke Test

| Pages | Languages | Result | Evidence |
|-------|-----------|--------|----------|
| Homepage, Register, Chat, Parent Report, Pricing, Contact/Footer | EN, DE, FR, IT | Passed | 24 Playwright route checks passed with correct route, at least one h1, no old homepage copy, no checked demo/mock/Codex/fake-checkout artifact text, no broken images, no horizontal overflow, no unlabeled form fields, and no unlabeled icon-only buttons. |

## Responsive Smoke Test

| Widths | Pages | Result | Evidence |
|--------|-------|--------|----------|
| 375px, 430px, 768px, 1024px, 1440px | Homepage, Register, Chat, Parent Report, Pricing, Contact | Passed | 30 Playwright route checks passed with no horizontal overflow, no broken images, and at least one h1. |

## Accessibility Smoke Test

| Check | Result | Evidence |
|-------|--------|----------|
| Tab navigation | Passed | Contact page first Tab moved focus to a link. |
| Focus visible | Passed | Focused element reported solid 2px outline. |
| Contact/register form labels | Passed | Multilingual smoke found zero unlabeled form fields across checked pages. |
| Icon buttons have accessible names | Passed | Multilingual smoke found zero unlabeled icon-only buttons across checked pages. |
| Dialog focus | Not applicable | No dialog was opened in this final smoke pass. |
| Color contrast regression | Passed | Header/footer contrast changes were verified in Phase 129 and no accessibility smoke regression was found. |
| h1 sanity | Passed | All checked pages had at least one h1. |

## Issues Found

- No P0 or P1 issues were found in Phase 130 verification.
- Non-blocking limitations remain from LC1: manual Safari/Firefox/Edge/Mobile Safari/Android Chrome passes, manual screen-reader pass, and native-speaker review are still recommended before broader external rollout.

## Go / No-Go

**Phase 130 decision:** Go for Phase 131 handoff documentation.

Final public demo Go / No-Go remains scheduled for Phase 132 after handoff docs, release notes, and sign-off records are complete.

