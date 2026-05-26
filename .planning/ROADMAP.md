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
- 🚧 **v1.21 Phase 22: Final Demo Packaging, Stakeholder Review, and Launch Candidate Preparation** - Phases 123-127 (planning)

## Phases

### Active Milestone: v1.21 Phase 22

Phase 22 packages the existing STOA frontend into a stable review and launch-candidate preparation set. It does not add new product functionality. The work fixes the final demo package, audience-specific scripts, demo accounts/data/reset expectations, stakeholder review, release locks, launch-candidate notes, known issues, backlog, approval checklist, final demo run result, README handoff, and release-branch preparation rules.

#### Phase 123: Final Demo Package and Audience Scripts

**Status:** Planned
**Plans:** 0/1
**Goal:** Create the final demo package and audience-specific demo scripts for formal review, investor demo, parent demo, student demo, tutor demo, admin demo, and internal launch-candidate checks.

**Requirements:** DEMO22-01 through DEMO22-09

**Success Criteria:**
1. `docs/demo/final-demo-package/` exists with overview, scripts, limitations, and troubleshooting docs.
2. Investor, parent, student, tutor, and admin scripts have audience-specific goals, order, timing, narrative emphasis, and pages to avoid.
3. Demo overview documents service startup, accounts, URLs, recommended sequence, and backend failure handling.

#### Phase 124: Demo Account, Demo Data, Reset, and API Contract Lock

**Status:** Planned
**Plans:** 0/1
**Goal:** Lock the final demo accounts, expected demo data, reset behavior, and final demo backend API contract.

**Requirements:** DATA22-01 through DATA22-08; API22-01 through API22-02

**Success Criteria:**
1. Demo account docs lock `student@test.com`, `parent@test.com`, `tutor@test.com`, and `admin@test.com` with `password123` for internal demo use only.
2. Demo data docs define required student, parent, tutor, and admin data after reset.
3. Reset docs state the command, expected result, repeatability requirements, and failure handling.
4. API contract lock covers auth, conversations, teacher help, tutor, parent, billing, contact, support, admin, and health endpoints.

#### Phase 125: Stakeholder Review and Final Release Locks

**Status:** Planned
**Plans:** 0/1
**Goal:** Create the stakeholder review checklist and final bug, copy, design, and translation locks.

**Requirements:** REVIEW22-01 through REVIEW22-03; TRIAGE22-01 through TRIAGE22-02; LOCK22-01 through LOCK22-04

**Success Criteria:**
1. Stakeholder review checklist defines roles, review items, and result classifications.
2. Bug triage rules classify P0/P1/P2/P3 and define fix, workaround, known-issue, and backlog handling.
3. Copy, design, and translation locks define covered surfaces and allowed post-lock changes.
4. Lock docs prevent new feature work, broad redesign, one-language-only changes, internal wording leaks, and unreviewed API contract changes.

#### Phase 126: Release Notes, Known Issues, Backlog, and Approval Checklist

**Status:** Planned
**Plans:** 0/1
**Goal:** Create launch-candidate release notes, known issues, next-stage backlog, and approval checklist.

**Requirements:** LC22-01 through LC22-02; ISSUE22-01 through ISSUE22-02; BACKLOG22-01; APPROVAL22-01 through APPROVAL22-02

**Success Criteria:**
1. `release-notes-lc1.md` documents version, date, summary, flows, roles, languages, demo backend mode, limitations, known issues, QA status, and approval status.
2. `known-issues.md` excludes P0 issues and requires workarounds for P1 issues.
3. `next-stage-backlog.md` groups deferred work by UI, copy, translation, accessibility, performance, backend, AWS, and product ideas.
4. `launch-candidate-approval.md` defines the branch-readiness checklist and approval criteria.

#### Phase 127: Final Demo Run, README, and Launch Candidate Branch Preparation

**Status:** Planned
**Plans:** 0/1
**Goal:** Run and record the final demo, update README, and prepare the launch-candidate branch rules without creating the release branch before approval gates pass.

**Requirements:** RUN22-01 through RUN22-05; README22-01; BRANCH22-01 through BRANCH22-02; SHIP22-01

**Success Criteria:**
1. `docs/demo/final-demo-run-result.md` records environment, commit hash, tester, flows, result, issues, and decision.
2. Final demo run covers reset, backend/mock mode, frontend startup, investor/student/tutor/parent/admin flows, contact, support, footer/legal links, language switcher, and mobile homepage/register/chat.
3. `npm install`, `npm run dev`, and `npm run build` are verified or exact environment limitations are recorded.
4. README includes the Phase 22 final demo package and launch-candidate section.
5. Release branch naming and bug-fix-only rules are documented, with branch creation deferred until approval criteria pass.

<details>
<summary>✅ v1.20 Phase 21: Accessibility, Cross-Browser QA, Brand Detail Integration, and Release Quality Gate (Phases 118-122) — SHIPPED 2026-05-26</summary>

- [x] Phase 118: Brand Detail Read-Only Audit and Integration Plan (1/1 plan) — completed 2026-05-26
- [x] Phase 119: Footer, Logo, Contact Page, and Contact API Contract (1/1 plan) — completed 2026-05-26
- [x] Phase 120: Accessibility, Keyboard, Screen Reader, and Contrast Hardening (1/1 plan) — completed 2026-05-26
- [x] Phase 121: Cross-Browser, Mobile, Visual Regression, and Performance QA (1/1 plan) — completed 2026-05-26
- [x] Phase 122: Release Quality Gate, README, and Handoff (1/1 plan) — completed 2026-05-26

Archive:
- `.planning/milestones/v1.20-REQUIREMENTS.md`
- `.planning/milestones/v1.20-ROADMAP.md`
- `.planning/milestones/v1.20-phases/`

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-117)</summary>

Phases 1-117 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, platform/organization demos, learning-intelligence demos, information architecture, stable demo backend support, premium homepage/onboarding refinement, EN/DE/FR/IT i18n, production-facing cleanup, brand-aligned visuals, and cross-locale copy/layout refinement.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Start with Phase 123. Phase 123 establishes the final demo package and scripts before account/data locks, stakeholder review, release notes, and final demo run.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 123. Final Demo Package and Audience Scripts | v1.21 | 0/1 | Planned | — |
| 124. Demo Account, Demo Data, Reset, and API Contract Lock | v1.21 | 0/1 | Planned | — |
| 125. Stakeholder Review and Final Release Locks | v1.21 | 0/1 | Planned | — |
| 126. Release Notes, Known Issues, Backlog, and Approval Checklist | v1.21 | 0/1 | Planned | — |
| 127. Final Demo Run, README, and Launch Candidate Branch Preparation | v1.21 | 0/1 | Planned | — |
