# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- ✅ **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (implemented 2026-05-24)
- ✅ **v1.6 Phase 7 Product Polishing, Analytics, and MVP Readiness** - Phases 28-34 (implemented 2026-05-25)
- 🔄 **v1.7 Phase 8 Staging Deployment, QA, and Early User Testing** - Phases 35-40 (planned 2026-05-25)

## Phases

<details open>
<summary>🔄 v1.7 Phase 8 Staging Deployment, QA, and Early User Testing (Phases 35-40) - PLANNED 2026-05-25</summary>

**Milestone Goal:** Upgrade STOA from a locally demoable MVP into a staging-ready product that early students, parents, tutors, and internal testers can access, test, and provide feedback on while CI and QA guard the iteration loop.

- [ ] **Phase 35: Staging Deployment Configuration** - Add SPA fallback, staging environment configuration, deployment docs, and local preview flow.
- [ ] **Phase 36: CI and Preview Workflow** - Add GitHub Actions CI for npm install, lint, and build/type checks; document preview checks.
- [ ] **Phase 37: Playwright E2E Smoke Suite** - Install Playwright, add config/scripts, and cover auth, student chat, parent, and tutor smoke paths.
- [ ] **Phase 38: Manual QA, Demo Reset, and Early User Testing Docs** - Add manual QA checklist, MVP demo docs, early user testing plan, and demo reset process.
- [ ] **Phase 39: Feedback Collection and Bug Workflow** - Add feedback UI/service/hook/backend persistence and GitHub bug workflow.
- [ ] **Phase 40: Performance, Security, Privacy, and Readiness Plan** - Add performance baseline, security review, legal placeholders, production readiness plan, README update, and final verification.

### Phase 35: Staging Deployment Configuration

**Goal**: Prepare static SPA deployment and staging environment configuration so direct staging links can be tested reliably.
**Depends on**: Phase 34
**Requirements**: [DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05]
**Success Criteria** (what must be TRUE):
  1. Vercel and/or Netlify SPA fallback config exists and supports React Router deep links.
  2. `.env.example` includes staging and production examples for API base URL, app env, demo shortcuts, analytics, and feedback flags.
  3. Staging deployment docs explain URL, backend URL, env vars, deploy/redeploy, preview, and success checks.
  4. Local preview flow is documented and can serve the built `dist` output.
  5. Deep routes such as `/chat`, `/parent`, and `/tutor/requests/:id` are included in deployment verification.
**Plans**: 0 plans complete

### Phase 36: CI and Preview Workflow

**Goal**: Add a reliable repository-level build gate before future staging work continues.
**Depends on**: Phase 35
**Requirements**: [CI-01, CI-02, CI-03]
**Success Criteria** (what must be TRUE):
  1. `.github/workflows/frontend-ci.yml` runs on push and pull request to `main`.
  2. CI uses Node.js 20 and `npm ci`.
  3. CI runs `npm run lint` and `npm run build`.
  4. README or deployment docs explain how preview checks should be run locally or by deployment platform.
**Plans**: 0 plans complete

### Phase 37: Playwright E2E Smoke Suite

**Goal**: Add initial browser smoke coverage for the core STOA student-parent-tutor loop.
**Depends on**: Phase 36
**Requirements**: [E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06]
**Success Criteria** (what must be TRUE):
  1. Playwright is installed as a dev dependency and configured for local Vite testing.
  2. `npm run test:e2e` and `npm run test:e2e:ui` scripts exist.
  3. `auth.spec.ts` covers demo login and logout.
  4. `student-chat.spec.ts` covers student chat send and teacher-help request path.
  5. `parent-dashboard.spec.ts` and `tutor-workflow.spec.ts` cover parent report and tutor request workflow.
  6. E2E docs explain local backend/demo data requirements and failure debugging.
**Plans**: 0 plans complete

### Phase 38: Manual QA, Demo Reset, and Early User Testing Docs

**Goal**: Make human testing and demo preparation repeatable for internal and early-user trials.
**Depends on**: Phase 37
**Requirements**: [QA-01, QA-02, QA-03, QA-04]
**Success Criteria** (what must be TRUE):
  1. Manual QA checklist covers auth, student, parent, tutor, and responsive checks.
  2. MVP demo flow doc covers student, tutor, and parent walkthroughs with demo accounts.
  3. Early user testing doc identifies tester groups, session structure, observation goals, and feedback collection.
  4. Demo reset process documents local SQLite reset and future staging reset expectations.
**Plans**: 0 plans complete

### Phase 39: Feedback Collection and Bug Workflow

**Goal**: Give early users a lightweight way to report issues and give the team a triage workflow.
**Depends on**: Phase 38
**Requirements**: [FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, BUG-01, BUG-02]
**Success Criteria** (what must be TRUE):
  1. Feedback API service and mutation hook submit typed feedback payloads.
  2. Feedback button/dialog are gated by `VITE_ENABLE_FEEDBACK`.
  3. Feedback payload includes type, page, message, user role, and created timestamp context.
  4. Local backend accepts `POST /feedback` and persists rows to SQLite.
  5. Feedback workflow docs and GitHub bug template define triage and severity.
**Plans**: 0 plans complete

### Phase 40: Performance, Security, Privacy, and Readiness Plan

**Goal**: Close the milestone with baseline quality documentation, public legal placeholders, and production-readiness handoff.
**Depends on**: Phase 39
**Requirements**: [PERF-01, PERF-02, SEC-01, SEC-02, LEGAL-01, LEGAL-02, DOCS-01, DOCS-02, DOCS-03, DOCS-04]
**Success Criteria** (what must be TRUE):
  1. Performance baseline doc defines Lighthouse pages, target metrics, and build bundle warning policy.
  2. Frontend security review doc covers secrets, localStorage, demo flags, route guards, 401/403, upload validation, and XSS.
  3. Public `/privacy` and `/terms` placeholder routes exist and are linked where appropriate.
  4. Production readiness plan documents remaining deployment, monitoring, analytics, privacy, support, and pilot launch work.
  5. README documents Phase 8 staging, CI, E2E, feedback, legal placeholders, and demo flow.
  6. Final verification records build, lint, E2E, backend feedback smoke, and route preview results.
**Plans**: 0 plans complete

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 35 -> 36 -> 37 -> 38 -> 39 -> 40

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 35. Staging Deployment Configuration | v1.7 | 0/0 | Not Started | — |
| 36. CI and Preview Workflow | v1.7 | 0/0 | Not Started | — |
| 37. Playwright E2E Smoke Suite | v1.7 | 0/0 | Not Started | — |
| 38. Manual QA, Demo Reset, and Early User Testing Docs | v1.7 | 0/0 | Not Started | — |
| 39. Feedback Collection and Bug Workflow | v1.7 | 0/0 | Not Started | — |
| 40. Performance, Security, Privacy, and Readiness Plan | v1.7 | 0/0 | Not Started | — |
