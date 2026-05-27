---
status: complete
created: "2026-05-27"
task: "Complete tutor profile information page"
---

# Quick Task: Complete Tutor Profile Information Page

## Goal

Add a teacher/tutor profile page so tutor accounts have the same level of account completeness as the student profile: identity, contact details, professional teaching context, and wage settlement/payment details.

## Scope

- Add tutor profile data contract and demo fallback.
- Add a tutor profile query hook.
- Add `/tutor/profile` route and tutor navigation entry.
- Build a polished profile page that clearly separates:
  - teacher identity and contact information
  - teaching qualifications and coverage
  - payout/salary settlement method
  - account/compliance status

## Verification

- `npm run lint`
- `npm run build`
- Browser check `/tutor/profile` at desktop and mobile widths.

## Result

Complete. `/tutor/profile` now shows teacher identity, contact details, teaching coverage, credentials, compliance, and salary settlement details, with a primary tutor navigation entry.
