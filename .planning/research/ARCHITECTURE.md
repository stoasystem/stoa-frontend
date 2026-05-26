# Phase 22 Research: Architecture

**Milestone:** v1.21 Phase 22

## Primary Integration Points

Phase 22 is documentation, verification, and launch-candidate process work. The main write scope should be:

```text
docs/demo/final-demo-package/
docs/demo/final-demo-run-result.md
docs/review/stakeholder-review-checklist.md
docs/release/
README.md
.planning/
```

Source code changes should be limited to bug fixes that block demo or launch-candidate readiness.

## Demo Package Structure

The final demo package should answer:

- What this demo shows.
- What it does not show.
- Which services must be running.
- Which accounts are used.
- Which URLs are part of the fixed demo flow.
- How to reset demo data.
- How to recover when demo backend, auth, browser, or language switching fails.

Audience scripts should define goal, timing, flow, pages to show, narrative emphasis, and pages to avoid.

## Release Lock Structure

Release docs should separate four concerns:

- Bug triage: P0/P1/P2/P3 classification and fix/workaround rules.
- Copy lock: surfaces covered and rules for post-lock text changes.
- Design lock: surfaces covered and rules for post-lock UI changes.
- Translation lock: supported locales and multilingual consistency requirements.
- API contract lock: demo backend endpoints and request/response stability rules.

This structure prevents last-minute demo prep from becoming broad product redesign.

## Demo Backend Boundary

The API contract lock should cover:

```text
/auth/login
/auth/register
/auth/me
/conversations
/conversations/:id
/conversations/:id/messages
/teacher-help/request
/tutors/me/help-requests
/parents/me/children
/parents/me/children/:childId/report
/billing/plans
/billing/subscription
/billing/usage
/billing/checkout-session
/contact/requests
/support/tickets
/admin/analytics/overview
/health
```

Locking the contract means frontend services, demo backend behavior, and docs must stay aligned if any required change appears.

## Launch Candidate Flow

Recommended sequence:

1. Create final demo package and scripts.
2. Lock demo accounts, demo data, reset behavior, and API contract.
3. Complete stakeholder review checklist and release locks.
4. Complete release notes, known issues, backlog, and approval checklist.
5. Run final demo, record result, update README, and prepare `release/launch-candidate-1` or `release/stoa-learning-platform-lc1`.

The release branch should be created only after build and core demo flow checks pass.

