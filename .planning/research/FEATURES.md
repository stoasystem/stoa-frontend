# Phase 22 Research: Features

**Milestone:** v1.21 Phase 22
**Focus:** Final demo packaging, stakeholder review, final locks, and launch-candidate preparation.

## Table Stakes

### Final Demo Package

The milestone must create a stable demo package under:

```text
docs/demo/final-demo-package/
```

Required files:

- `demo-overview.md`
- `investor-demo-script.md`
- `parent-demo-script.md`
- `student-demo-script.md`
- `tutor-demo-script.md`
- `admin-demo-script.md`
- `demo-accounts.md`
- `demo-data-reset.md`
- `demo-known-limitations.md`
- `demo-troubleshooting.md`

The package should make the demo repeatable for investor, parent, student, tutor, admin, and internal review contexts.

### Demo Account and Data Lock

Final demo accounts:

- Student: `student@test.com` / `password123`
- Parent: `parent@test.com` / `password123`
- Tutor: `tutor@test.com` / `password123`
- Admin: `admin@test.com` / `password123`

The milestone should validate and document:

- Each account can log in.
- Each account lands in the correct role experience.
- Student data includes conversations, upload example, teacher-help request, learning history, and next action.
- Parent data includes linked child, reports, recommendations, and billing/plan state.
- Tutor data includes pending, in-progress, and resolved requests plus availability/context.
- Admin data includes usage, support, feedback, teacher help, and contact request visibility.
- Reset returns the demo to a repeatable state.

### Stakeholder Review and Locks

Required docs:

- `docs/review/stakeholder-review-checklist.md`
- `docs/release/final-bug-triage.md`
- `docs/release/final-copy-lock.md`
- `docs/release/final-design-lock.md`
- `docs/release/final-translation-lock.md`
- `docs/release/final-demo-api-contract-lock.md`

The review output should classify results as:

- Approved
- Approved with minor fixes
- Needs revision
- Blocked

### Launch Candidate Package

Required docs:

- `docs/release/release-notes-lc1.md`
- `docs/release/known-issues.md`
- `docs/release/next-stage-backlog.md`
- `docs/release/launch-candidate-approval.md`
- `docs/demo/final-demo-run-result.md`

The launch-candidate path should only proceed when build passes, P0 bugs are zero, core demo flows pass, locks are complete, and known issues are accepted.

## Differentiators

- Demo scripts are audience-specific, not generic route inventories.
- Release locks separate true launch blockers from later backlog work.
- The final demo run records actual evidence: date, environment, commit hash, tester, flows tested, failures, and decision.
- Known issues explicitly exclude P0 issues and require workarounds for P1 issues.

## Anti-Features

- Do not redesign homepage, register, multilingual system, or demo backend.
- Do not add complex backend or database design.
- Do not add production AWS deployment or real payment processing.
- Do not add new app modules under the label of launch candidate preparation.
- Do not present unverified demo data as production readiness.

