# Phase 23 Research: Pitfalls

**Milestone:** v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release
**Date:** 2026-05-26

## Common Risks

### Scope Creep During Bug Fixing

Release-candidate cleanup can turn into redesign or feature expansion. Prevent this by requiring every change to map to a bug, approval item, or release blocker.

### Breaking Release Locks

Small copy or layout fixes can accidentally violate copy, design, translation, or API locks. Prevent this by checking the relevant lock doc after any change.

### One-Language Fixes

Fixing only English can leave German/French/Italian inconsistent or broken. Prevent this by treating visible copy and layout changes as cross-locale work.

### Demo Artifact Leaks

Internal language such as demo backend, mock API, fake checkout, or Codex can reappear through errors, docs copied into UI, or fallback labels. Prevent this with targeted scans and manual page review.

### Unstable Demo Backend State

Manual testing can create dirty demo state. Prevent this by resetting demo data before formal final runs and recording reset status.

### Public Demo Mislabeling

Public demo release is not production launch. Prevent this by separating internal and external release notes and documenting known limitations accurately.

### Environment Drift

Public demo flags can expose demo accounts or debug panels if misconfigured. Prevent this with deployment handoff env-variable checklist.

### Insufficient Evidence

A Go decision without flow evidence is weak. Prevent this by recording date, commit hash, environment, tester, browser, device, language, flow results, issues, and Go/No-Go.

## Warning Signs

- P0 bug accepted as a known issue.
- P1 bug has no workaround.
- A fix touches many unrelated files.
- New dependencies appear in a bug-fix milestone.
- Copy/design changes are not tied to a release blocker.
- Four-language checks are skipped after UI text changes.
- Contact/logo/footer changes are made without trust/info verification.

