# Investor Demo Script

## Goal

Show STOA as a multilingual learning product with an understandable business loop: students get immediate learning support, professional teachers stay involved when needed, parents gain visibility, and operations can monitor demand.

## Timing

10-15 minutes.

## Flow

1. Open `/`.
   - Say: STOA gives students immediate learning support and keeps professional teacher support available when it matters.
2. Open `/register`.
   - Show role-based onboarding only briefly.
3. Sign in as `student@test.com`.
4. Open `/chat`.
   - Show a student question, explanation flow, homework upload metadata if available, and teacher-help request path.
5. Sign in as `tutor@test.com`.
   - Open `/tutor/requests` and show pending, in-progress, and resolved work.
6. Sign in as `parent@test.com`.
   - Open `/parent/children/user-student/report` and show weekly progress, weak topics, and recommendations.
7. Open `/pricing` and `/billing`.
   - Explain subscription path readiness without presenting real payment collection as live.
8. Sign in as `admin@test.com`.
   - Open `/admin` and `/admin/analytics` for operational visibility.
9. End with launch-candidate status.
   - Mention final locks, known issues, and next-stage backlog.

## Emphasis

- Product loop: student question -> learning assistant -> teacher support -> parent visibility -> operational insight.
- Teachers are part of the workflow, not replaced.
- The demo backend is repeatable and replaceable.
- Four-language support is part of Swiss-market readiness.

## Avoid

- Deep settings pages.
- Advanced internal diagnostics.
- Placeholder or hidden demo-only pages.
- Backend implementation details.
- Payment claims beyond virtual/hosted checkout readiness.

