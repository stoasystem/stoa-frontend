# Phase 23 Research: Release Features

**Milestone:** v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release
**Date:** 2026-05-26

Phase 23 is a release execution milestone, not a feature milestone. The "features" are release capabilities and evidence artifacts.

## Table Stakes

### Bug Triage and Change Control

- Launch-candidate bugs are classified P0/P1/P2/P3.
- Required stakeholder approval changes are recorded with source, page, issue, priority, decision, and status.
- Every code change maps to a bug, final approval item, or release blocker.
- P0 is fixed; P1 is fixed or accepted with workaround; P2 is optional only when low-risk; P3 is deferred.

### Lock Preservation

- Copy lock, design lock, translation lock, and demo API contract lock remain active.
- Changes are checked for user-facing demo/mock/Codex residue.
- Four-language copy changes are synchronized where applicable.
- API shape changes are avoided unless required for a P0 blocker.

### Final Verification

- Full student, tutor, parent, admin, contact, pricing/billing, and homepage paths are rerun.
- Multilingual smoke checks cover English, German, French, and Italian.
- Responsive smoke checks cover 375, 430, 768, 1024, and 1440 px widths.
- Accessibility smoke checks cover tab order, focus, form labels, icon labels, dialog focus, contrast, and h1 sanity.
- Demo backend health, reset, account login, and core API behavior are verified.

### Public Demo Release Handoff

- Public demo final run is recorded.
- Deployment handoff is documented.
- Demo monitoring plan is documented.
- First external presentation support is documented.
- Public demo release notes separate internal and external language.
- Go/No-Go decision is recorded.
- README includes Phase 23 guidance.

## Differentiators

- Clear separation between internal release notes and external-facing public demo messaging.
- Explicit Go/No-Go conditions grounded in P0/P1 status and core flow evidence.
- Release monitoring plan with 48-hour and pre-presentation checks.
- First external presentation support with fallback paths for chat/backend/network failures.

## Anti-Features

- New product modules.
- Large visual redesign.
- Reopened broad copy or translation work.
- New language support.
- Real production backend/payment/email/CRM work.
- Treating public demo release as production launch.

