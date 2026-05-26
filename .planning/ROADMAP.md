# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- ✅ **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (implemented 2026-05-25)
- ✅ **v1.8 Phase 9 Production Readiness, Monitoring, and Pilot Launch** - Phases 41-47 (implemented 2026-05-25)
- ✅ **v1.9 Phase 10: Pilot Iteration, Payment Preparation, and Production Launch** - Phases 48-55 (implemented 2026-05-25)
- ✅ **v1.10 Phase 11: Paid Launch Frontend, Growth Funnel, and Operational UI Scaling** - Phases 56-63 (implemented 2026-05-25)
- ✅ **v1.11 Phase 12: Frontend Platform Scaling, School Partnership UI, and Advanced Learning Intelligence Design** - Phases 64-72 (implemented 2026-05-25)
- ✅ **v1.12 Phase 13: Information Architecture, Page Flow, and UX Optimization** - Phases 73-79 (implemented 2026-05-25)
- ✅ **v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness** - Phases 80-86 (implemented 2026-05-25)
- ✅ **v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement** - Phases 87-91 (implemented 2026-05-25)
- ✅ **v1.15 Phase 16: Multilingual Language Optimization and AI Terminology Replacement** - Phases 92-97 (implemented 2026-05-25)
- ✅ **v1.16 Phase 17: Locale-Specific Copywriting, Responsive Typography, and Multilingual UI Refinement** - Phases 98-102 (implemented 2026-05-25)
- ✅ **v1.17 Phase 18: Production-Facing Cleanup, Stability Hardening, and Demo Artifact Removal** - Phases 103-107 (implemented 2026-05-26)
- ✅ **v1.18 Phase 19: Brand-Aligned Visual Refinement with Main Website Design Translation** - Phases 108-112 (implemented 2026-05-26)
- ✅ **v1.19 Phase 20: Cross-Locale Copy Refinement, German Style Alignment, and Layout Adaptation** - Phases 113-117 (implemented 2026-05-26)
- ✅ **v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate** - Phases 118-122 (implemented 2026-05-26)
- ✅ **v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation** - Phases 123-127 (implemented 2026-05-26)
- 🚧 **v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release** - Phases 128-132 (planning)

## Phases

### Active Milestone: v1.22 Phase 23

Phase 23 converts the Phase 22 launch candidate into a public demo release. It does not add new product functionality. The work is limited to launch-candidate bug triage, required final approval changes, P0/P1 blocker fixes, release-lock preservation, final demo rerun, multilingual/responsive/accessibility smoke tests, public demo release handoff docs, release notes, Go/No-Go, README, and release branch/tag/deployment confirmation.

#### Phase 128: Final Approval Intake and Launch Candidate Bug Triage

**Status:** Complete
**Plans:** 1/1
**Goal:** Capture final approval changes, classify launch-candidate bugs, and define which items are allowed into Phase 23.

**Requirements:** APPROVAL23-01 through APPROVAL23-02; BUG23-01 through BUG23-04

**Success Criteria:**
1. `docs/release/final-approval-changes.md` exists with required final approval items and statuses.
2. Launch-candidate bugs are classified P0/P1/P2/P3 using Phase 22 triage rules.
3. P0/P1 handling is explicit: P0 must be fixed, P1 must be fixed or accepted with workaround.
4. P2/P3 issues are deferred unless they are low-risk and low-cost.
5. New feature requests and non-blocking aesthetic preferences are excluded from Phase 23 scope.

#### Phase 129: Blocker Fixes and Release Lock Preservation

**Status:** Complete
**Plans:** 1/1
**Goal:** Fix only approved release blockers and verify that copy, design, translation, and API locks remain intact.

**Requirements:** FIX23-01 through FIX23-02; LOCK23-01 through LOCK23-04

**Success Criteria:**
1. Any code change maps to a P0/P1 bug, final approval item, or release blocker.
2. Targeted checks confirm core demo flow, mobile, build, and user-facing terminology are not regressed.
3. Copy lock, design lock, translation lock, and demo API contract lock are rechecked after fixes.
4. No new user-visible demo/mock/Codex/fake-checkout wording is introduced.
5. Any unavoidable lock exception is documented with reason and retest evidence.

#### Phase 130: Final Demo Rerun and Smoke Test Evidence

**Status:** Complete
**Plans:** 1/1
**Goal:** Rerun the full public demo candidate and record multilingual, responsive, accessibility, backend, contact, and build smoke evidence.

**Requirements:** RUN23-01 through RUN23-03; SMOKE23-01 through SMOKE23-04

**Success Criteria:**
1. Demo data reset, backend/mock mode, frontend startup, `/health`, language switcher, and demo accounts are checked.
2. Student, tutor, parent, admin, contact, pricing/billing, and homepage paths are rerun.
3. `docs/release/public-demo-final-run.md` records commit, environment, tester, browser, device, language, issues, and Go/No-Go.
4. EN/DE/FR/IT multilingual smoke test passes or exact issues are recorded.
5. Responsive and accessibility smoke tests pass or exact issues are recorded.
6. `npm run build` passes after release-candidate fixes.

#### Phase 131: Public Demo Release Handoff Documents

**Status:** Planned
**Plans:** 0/1
**Goal:** Prepare deployment, monitoring, first external presentation, and public demo release notes documents.

**Requirements:** HANDOFF23-01 through HANDOFF23-02; MONITOR23-01; PRESENT23-01; NOTES23-01 through NOTES23-02

**Success Criteria:**
1. `docs/release/deployment-handoff.md` documents target, env vars, API mode, backend URL, build/preview commands, rollback, contact, and limitations.
2. Public demo environment flags hide demo accounts, demo badges, and internal debug surfaces.
3. `docs/release/demo-monitoring-plan.md` defines release and pre-presentation monitoring checks.
4. `docs/release/first-external-presentation-support.md` defines demo preparation, accounts, fallback paths, pages to avoid, and feedback collection.
5. `docs/release/public-demo-release-notes.md` includes internal and external notes with external wording free of mock/demo backend/fake checkout/Codex language.

#### Phase 132: Go / No-Go, README, and Public Demo Release Confirmation

**Status:** Planned
**Plans:** 0/1
**Goal:** Record the final Go/No-Go decision, update README, and confirm release branch/tag/deployment readiness.

**Requirements:** GONOGO23-01; README23-01; RELEASE23-01 through RELEASE23-02; SIGNOFF23-01

**Success Criteria:**
1. `docs/release/go-no-go-decision.md` records Go and No-Go criteria, P0/P1 status, stakeholder approval status, and final decision.
2. README includes Phase 23 launch-candidate bug fixing and public demo release guidance.
3. Release tag or release branch plan is recorded and follows bug-fix-only rules.
4. Public demo release branch or deployment confirmation is recorded, or exact blocker is documented.
5. Stakeholder final sign-off is recorded before public demo release is marked Go.

<details>
<summary>✅ v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation (Phases 123-127) — SHIPPED 2026-05-26</summary>

- [x] Phase 123: Final Demo Package and Audience Scripts (1/1 plan) — completed 2026-05-26
- [x] Phase 124: Demo Account, Demo Data, Reset, and API Contract Lock (1/1 plan) — completed 2026-05-26
- [x] Phase 125: Stakeholder Review and Final Release Locks (1/1 plan) — completed 2026-05-26
- [x] Phase 126: Release Notes, Known Issues, Backlog, and Approval Checklist (1/1 plan) — completed 2026-05-26
- [x] Phase 127: Final Demo Run, README, and Launch Candidate Branch Preparation (1/1 plan) — completed 2026-05-26

Archive:
- `.planning/milestones/v1.21-REQUIREMENTS.md`
- `.planning/milestones/v1.21-ROADMAP.md`
- `.planning/milestones/v1.21-phases/`

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-122)</summary>

Phases 1-122 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, platform/organization demos, learning-intelligence demos, information architecture, stable demo backend support, premium homepage/onboarding refinement, EN/DE/FR/IT i18n, production-facing cleanup, brand-aligned visuals, cross-locale copy/layout refinement, accessibility hardening, brand detail integration, and release-quality gates.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Start with Phase 128. Phase 128 defines the approved bug/final-approval intake before any fixes are made. Phase 129 then performs scoped fixes, Phase 130 verifies the release candidate, Phase 131 prepares handoff docs, and Phase 132 records Go/No-Go and release confirmation.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 128. Final Approval Intake and Launch Candidate Bug Triage | v1.22 | 1/1 | Complete | 2026-05-26 |
| 129. Blocker Fixes and Release Lock Preservation | v1.22 | 1/1 | Complete | 2026-05-26 |
| 130. Final Demo Rerun and Smoke Test Evidence | v1.22 | 1/1 | Complete | 2026-05-26 |
| 131. Public Demo Release Handoff Documents | v1.22 | 0/1 | Planned | — |
| 132. Go / No-Go, README, and Public Demo Release Confirmation | v1.22 | 0/1 | Planned | — |
