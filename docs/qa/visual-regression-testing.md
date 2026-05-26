# Visual Regression Testing

## Baseline Strategy

Use Playwright screenshots as the first visual-regression baseline for release-critical routes.

Recommended route matrix:

```text
/
/login
/register
/chat
/parent
/parent/children/student-anna/report
/tutor
/pricing
/billing
/contact
/support
```

Recommended locale matrix for P0 public surfaces:

```text
en
de
fr
it
```

Recommended widths:

```text
375
430
768
1024
1440
```

## Initial Automation State

The existing Playwright suite now runs successfully in deterministic demo QA mode:

```text
npm run test:e2e
12 passed
```

This establishes a functional baseline before screenshot assertions are added. Screenshot assertions should be introduced route by route to avoid locking unstable legacy pages too early.

## Suggested Next Implementation

Add a dedicated `visual-regression.spec.ts` with controlled routes, fixed viewport sizes, reduced motion, and explicit locale query/local-storage setup. Store screenshot baselines through Playwright snapshot management.

## Current Limit

Phase 121 does not commit PNG baselines. It documents the baseline matrix and keeps functional E2E green first. Screenshot baselines are ready to add once the team accepts snapshot churn in the repository.
