# Release Notes: STOA Learning Platform LC1

## Version Name

STOA Learning Platform Launch Candidate 1 (`LC1`)

## Release Date

Target: 2026-05-26

## Summary

This launch candidate presents the STOA Learning Platform as a multilingual learning product with student question support, professional teacher support, parent visibility, pricing flow, contact form, support flow, and operational demo views.

## Main User Flows

- Public homepage and role-based registration.
- Student chat, homework upload metadata, teacher-help request, and learning history.
- Parent dashboard, linked child, weekly report, recommendations, and billing context.
- Tutor request queue, request detail, student context, note, and status update.
- Pricing and virtual/hosted-checkout-ready billing path.
- Contact request and support ticket flow.
- Admin overview and analytics/operations visibility.

## Supported Roles

- Student.
- Parent.
- Tutor.
- Admin.

## Supported Languages

- English.
- German.
- French.
- Italian.

## Demo Backend Mode

LC1 uses the local demo backend/API contract for repeatable frontend demonstration. The demo backend is not the production backend and is not a production database, production auth, production payment, production analytics, or production support system.

## Known Limitations

- Manual browser/device checks remain required for Safari, Firefox, Edge, Mobile Safari, and Android Chrome.
- Manual screen-reader smoke test remains required.
- Native-speaker review for German, French, and Italian remains recommended.
- Payment collection is not live.
- Admin/analytics/support views are operational demos, not production operations.

## Known Issues

See `docs/release/known-issues.md`.

## QA Status

- Install: passed with `npm install --ignore-scripts`.
- Demo reset: passed with `npm run demo:reset`.
- Demo backend startup: passed with `npm run demo:backend` after script alignment to `backend/.venv/bin/python`.
- Dev server: passed; local frontend returned HTTP 200.
- Lint: passed with `npm run lint`.
- Build: passed with `npm run build`.
- API smoke: passed for health, fixed-account login, student conversations, parent child, tutor requests, admin analytics, contact request, and support ticket.
- Phase 21 Chromium E2E smoke: previously passed.
- Final demo run result: recorded in `docs/demo/final-demo-run-result.md`.

## Approval Status

Local documentation and smoke verification passed. Stakeholder approval and known-issues acceptance remain pending before external launch-candidate approval.
