# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent final demo flows, locked release evidence, and a clean Go/No-Go path for public demo release.

## v1.22 Requirements

Requirements for Phase 23. Each requirement maps to exactly one roadmap phase.

### Final Approval and Bug Triage

- [x] **APPROVAL23-01**: `docs/release/final-approval-changes.md` records each required final approval change with ID, source reviewer, page, issue, required change, priority, decision, and status.
- [x] **APPROVAL23-02**: Final approval changes explicitly reject new features, non-blocking aesthetic preferences, unrelated roadmap ideas, and future platform functionality.
- [x] **BUG23-01**: Launch-candidate bugs are reviewed and classified as P0, P1, P2, or P3 using the Phase 22 final bug triage policy.
- [x] **BUG23-02**: P0 bugs are marked fix-required and cannot be accepted as known issues.
- [x] **BUG23-03**: P1 bugs are fixed or recorded with an accepted workaround and owner.
- [x] **BUG23-04**: P2/P3 issues are either fixed only when low-risk or moved to known issues/backlog without expanding Phase 23 scope.

### Blocker Fixes and Lock Preservation

- [x] **FIX23-01**: Code changes are limited to P0/P1 blockers, required approval changes, or release blockers.
- [x] **FIX23-02**: Each code change is checked against core demo flow impact, mobile impact, build impact, and risk of new user-facing demo/mock/Codex residue.
- [x] **LOCK23-01**: Copy lock remains valid after Phase 23 fixes or any allowed copy change is documented as approval/blocker-driven.
- [x] **LOCK23-02**: Design lock remains valid after Phase 23 fixes or any allowed visual change is documented as approval/blocker-driven.
- [x] **LOCK23-03**: Translation lock remains valid across English, German, French, and Italian after Phase 23 fixes.
- [x] **LOCK23-04**: Demo API contract lock remains valid unless a P0 blocker requires an explicit documented exception and retest.

### Final Demo Rerun and Smoke Tests

- [x] **RUN23-01**: Demo data reset, demo backend/mock mode, frontend startup, backend `/health`, language switcher, and demo accounts are checked before final run.
- [x] **RUN23-02**: Full final demo flow is rerun across homepage, student registration/login, chat question, Learning Assistant response, professional teacher support request, tutor workflow, parent report, pricing/billing, contact form, and admin overview.
- [x] **RUN23-03**: `docs/release/public-demo-final-run.md` records date, commit hash, environment, tester, browser, device, language, flow result, issues found, and Go/No-Go.
- [x] **SMOKE23-01**: Final multilingual smoke test covers homepage, register, chat, parent report, pricing, contact, and footer in English, German, French, and Italian.
- [x] **SMOKE23-02**: Final responsive smoke test covers 375px, 430px, 768px, 1024px, and 1440px for homepage, register, chat, parent report, pricing, and contact.
- [x] **SMOKE23-03**: Final accessibility smoke test covers tab navigation, visible focus, contact/register labels, icon-button labels, dialog focus, color contrast, and h1 sanity.
- [x] **SMOKE23-04**: `npm run build` passes after all release-candidate fixes.

### Public Demo Release Handoff

- [x] **HANDOFF23-01**: `docs/release/deployment-handoff.md` documents deployment target, environment variables, API mode, demo backend URL, build command, preview command, rollback instruction, contact person, and known limitations.
- [x] **HANDOFF23-02**: Deployment handoff recommends public demo release flags with demo accounts, demo badges, and internal debug hidden.
- [x] **MONITOR23-01**: `docs/release/demo-monitoring-plan.md` documents what to monitor after release, 48-hour check frequency, and pre-presentation smoke timing.
- [x] **PRESENT23-01**: `docs/release/first-external-presentation-support.md` documents pre-demo preparation, recommended browser/device/accounts, fallback paths, pages to avoid, and feedback collection.
- [x] **NOTES23-01**: `docs/release/public-demo-release-notes.md` documents release name, date, purpose, flows, roles, languages, internal demo backend note, known limitations, and contact/support info.
- [x] **NOTES23-02**: External-facing release notes avoid mock, demo backend, fake checkout, and Codex wording.

### Go / No-Go and Public Release

- [x] **GONOGO23-01**: `docs/release/go-no-go-decision.md` records Go and No-Go criteria, P0/P1 status, stakeholder approval status, and final decision.
- [x] **README23-01**: README includes the Phase 23 launch-candidate bug fixing and public demo release section.
- [x] **RELEASE23-01**: Release tag or release branch plan is recorded and follows bug-fix-only release branch rules.
- [x] **RELEASE23-02**: Public demo release branch or deployment confirmation is recorded, or exact external blocker is documented.
- [x] **SIGNOFF23-01**: Stakeholder final sign-off is recorded before public demo release is marked Go.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 24 Public Demo Feedback and Backend Handoff

- **FEEDBACK24-01**: Public demo feedback is collected, categorized, and analyzed after external demos.
- **ITERATION24-01**: Next frontend iteration plan is prioritized from external parent, teacher, investor, and partner feedback.
- **BACKEND24-01**: Real backend handoff package is prepared from public demo evidence and release gaps.
- **AWS24-01**: AWS integration handoff package is prepared without implementing complex backend/cloud work in the frontend.

## Out of Scope

Explicitly excluded from v1.22 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New product features | Phase 23 is release execution and bug fixing only. |
| New pages or new languages | Public demo release should stabilize existing surfaces. |
| Product direction changes | Direction was locked by launch-candidate preparation. |
| Broad copy rewrite | Copy lock remains active; only blocker/approval copy changes are allowed. |
| Broad visual redesign | Design lock remains active; only blocker/approval visual fixes are allowed. |
| Navigation refactor | Navigation is release-locked unless a P0/P1 blocker requires a narrow fix. |
| API contract changes | Demo API contract lock remains active unless a P0 blocker requires an exception. |
| Complex backend/database work | Production backend architecture belongs to future backend handoff. |
| AWS deployment implementation | Phase 23 can hand off deployment and confirm release, not build cloud infrastructure. |
| Real payment processing | Public demo release is not paid production launch. |
| Production support/CRM/email operations | Contact/support remain demo/API-contract surfaces unless external systems already exist. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| APPROVAL23-01 | Phase 128 | Done |
| APPROVAL23-02 | Phase 128 | Done |
| BUG23-01 | Phase 128 | Done |
| BUG23-02 | Phase 128 | Done |
| BUG23-03 | Phase 128 | Done |
| BUG23-04 | Phase 128 | Done |
| FIX23-01 | Phase 129 | Done |
| FIX23-02 | Phase 129 | Done |
| LOCK23-01 | Phase 129 | Done |
| LOCK23-02 | Phase 129 | Done |
| LOCK23-03 | Phase 129 | Done |
| LOCK23-04 | Phase 129 | Done |
| RUN23-01 | Phase 130 | Done |
| RUN23-02 | Phase 130 | Done |
| RUN23-03 | Phase 130 | Done |
| SMOKE23-01 | Phase 130 | Done |
| SMOKE23-02 | Phase 130 | Done |
| SMOKE23-03 | Phase 130 | Done |
| SMOKE23-04 | Phase 130 | Done |
| HANDOFF23-01 | Phase 131 | Done |
| HANDOFF23-02 | Phase 131 | Done |
| MONITOR23-01 | Phase 131 | Done |
| PRESENT23-01 | Phase 131 | Done |
| NOTES23-01 | Phase 131 | Done |
| NOTES23-02 | Phase 131 | Done |
| GONOGO23-01 | Phase 132 | Done |
| README23-01 | Phase 132 | Done |
| RELEASE23-01 | Phase 132 | Done |
| RELEASE23-02 | Phase 132 | Done |
| SIGNOFF23-01 | Phase 132 | Done |

**Coverage:**
- v1.22 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 during v1.22 milestone initialization*
