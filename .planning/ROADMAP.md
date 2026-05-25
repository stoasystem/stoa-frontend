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

## Phases

<details open>
<summary>⏳ v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness (Phases 80-86)</summary>

**Milestone Goal:** Stabilize a simple, replaceable demo backend and API contract layer so the existing STOA frontend can run complete demo flows for auth, student chat, teacher help, parent reports, billing, referrals, support, and admin analytics while preparing for future real backend and AWS integration.

- [x] **Phase 80: Demo Backend Scope, API Contract, and Data Documentation** - Document demo backend boundaries, endpoint contracts, demo data, and reset flow before implementation changes.
- [x] **Phase 81: Demo Data Seed and Reset Stabilization** - Normalize fixed demo accounts, demo state, and reset behavior for repeatable frontend demos.
- [x] **Phase 82: Auth, Health, Student Chat, and Message Demo APIs** - Stabilize health/auth/conversation/message endpoints and deterministic assistant responses.
- [x] **Phase 83: Teacher Help, Tutor Handling, and Parent Report APIs** - Stabilize help-request status flow and parent child/report/history endpoints.
- [x] **Phase 84: Billing, Referral, Support, and Admin Demo APIs** - Stabilize mock checkout, referrals, support tickets, feedback, and admin analytics endpoints.
- [x] **Phase 85: Frontend API Mode and Service Layer Alignment** - Add API mode configuration and audit frontend API calls through service boundaries.
- [x] **Phase 86: Backend Integration Readiness, QA, README, and Build Closure** - Add real backend/AWS readiness docs, demo backend QA, README updates, and final verification.

### Phase 80: Demo Backend Scope, API Contract, and Data Documentation

**Goal**: Establish the Phase 14 contract and boundary before backend or frontend changes.
**Depends on**: Phase 79
**Requirements**: [SCOPE-01, SCOPE-02, SCOPE-03, SCOPE-04]
**Success Criteria** (what must be TRUE):
  1. `docs/demo-backend/demo-backend-scope.md` states demo-only responsibilities, replacement boundary, and explicit non-goals.
  2. `docs/demo-backend/demo-api-contract.md` documents all Phase 14 endpoint methods, paths, request/response shapes, auth expectations, status codes, and error codes.
  3. `docs/demo-backend/demo-data.md` documents fixed accounts, role links, and minimum demo data by domain.
  4. `docs/demo-backend/demo-reset-flow.md` documents reset command behavior and restored/cleared state.
**Plans**: 1/1

### Phase 81: Demo Data Seed and Reset Stabilization

**Goal**: Make demo data deterministic and resettable without adding production persistence complexity.
**Depends on**: Phase 80
**Requirements**: [DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06]
**Success Criteria** (what must be TRUE):
  1. Fixed student, parent, tutor, and admin demo accounts exist after reset.
  2. Demo data covers conversations, uploaded file metadata, learning history, parent reports, tutor requests, billing, referrals, support, and admin analytics.
  3. Parent is linked to the demo student and tutor/admin records reference stable IDs.
  4. Reset command restores fixed state and clears temporary registration/support/session changes.
**Plans**: 1/1

### Phase 82: Auth, Health, Student Chat, and Message Demo APIs

**Goal**: Stabilize the core student-facing backend demo loop.
**Depends on**: Phase 81
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06]
**Success Criteria** (what must be TRUE):
  1. `/health`, `/auth/login`, `/auth/register`, and `/auth/me` return documented demo responses and errors.
  2. Student can list, open, and create conversations through documented endpoints.
  3. Student can send messages and receive deterministic assistant demo answers.
  4. Conversation/message changes persist for the current demo session or until reset.
**Plans**: 1/1

### Phase 83: Teacher Help, Tutor Handling, and Parent Report APIs

**Goal**: Close the cross-role learning support loop for student, tutor, and parent demos.
**Depends on**: Phase 82
**Requirements**: [HELP-01, HELP-02, HELP-03, HELP-04, HELP-05, PARENT-01, PARENT-02, PARENT-03, PARENT-04, PARENT-05]
**Success Criteria** (what must be TRUE):
  1. Student can create teacher-help requests tied to conversations.
  2. Tutor can list, open, and update help-request status.
  3. Parent endpoints return child list, summary, history, weekly report, and monthly report placeholder.
  4. Help-request state changes are visible to related demo surfaces where applicable.
**Plans**: 1/1

### Phase 84: Billing, Referral, Support, and Admin Demo APIs

**Goal**: Stabilize commercial, support, and operational demo APIs.
**Depends on**: Phase 83
**Requirements**: [OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06]
**Success Criteria** (what must be TRUE):
  1. Billing endpoints return plans, subscription, usage, feature access, and mock checkout URL.
  2. Referral endpoint returns stable code, invite URL, and successful invite count.
  3. Feedback/support ticket APIs can create and view demo-session records.
  4. Admin endpoints return analytics overview, support tickets, help requests, and feedback with standard demo errors.
**Plans**: 1/1

### Phase 85: Frontend API Mode and Service Layer Alignment

**Goal**: Keep the frontend decoupled from demo backend internals and ready to switch API modes.
**Depends on**: Phase 84
**Requirements**: [API-01, API-02, API-03, API-04, API-05]
**Success Criteria** (what must be TRUE):
  1. `.env.example` documents `VITE_API_MODE`, `VITE_API_BASE_URL`, and `VITE_ENABLE_MSW`.
  2. `src/lib/env.ts` exports API mode, API base URL, and MSW flag with documented safe defaults.
  3. Shared API client uses configured base URL and bearer-token behavior.
  4. API mode values `mock`, `demo`, `staging`, and `production` are documented.
  5. Frontend API usage audit finds no page component API URL hard-coding that should be moved to services.
**Plans**: 1/1

### Phase 86: Backend Integration Readiness, QA, README, and Build Closure

**Goal**: Close Phase 14 with backend handoff docs and verified demo workflow.
**Depends on**: Phase 85
**Requirements**: [READY-01, READY-02, READY-03, READY-04, READY-05, READY-06]
**Success Criteria** (what must be TRUE):
  1. `docs/backend-integration/real-backend-readiness.md` maps endpoint contracts and future backend implementation needs.
  2. `docs/backend-integration/aws-readiness-notes.md` documents frontend-facing AWS readiness concerns.
  3. `docs/qa/demo-backend-qa.md` covers startup, health, reset, core demo flows, and integration readiness checks.
  4. README documents Phase 14 workflow, demo accounts, run/reset commands, API modes, and non-production boundary.
  5. Complete demo flow is verified against the demo backend where practical.
  6. `npm run build` passes.
**Plans**: 1/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-79)</summary>

Phases 1-79 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, and Phase 13 verification.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phase 14 phases planned in numeric order: 80 -> 81 -> 82 -> 83 -> 84 -> 85 -> 86

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 80. Demo Backend Scope, API Contract, and Data Documentation | v1.13 | 1/1 | Complete | 2026-05-25 |
| 81. Demo Data Seed and Reset Stabilization | v1.13 | 1/1 | Complete | 2026-05-25 |
| 82. Auth, Health, Student Chat, and Message Demo APIs | v1.13 | 1/1 | Complete | 2026-05-25 |
| 83. Teacher Help, Tutor Handling, and Parent Report APIs | v1.13 | 1/1 | Complete | 2026-05-25 |
| 84. Billing, Referral, Support, and Admin Demo APIs | v1.13 | 1/1 | Complete | 2026-05-25 |
| 85. Frontend API Mode and Service Layer Alignment | v1.13 | 1/1 | Complete | 2026-05-25 |
| 86. Backend Integration Readiness, QA, README, and Build Closure | v1.13 | 1/1 | Complete | 2026-05-25 |
