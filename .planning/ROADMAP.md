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
- ⏳ **v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement** - Phases 87-91

## Phases

<details open>
<summary>⏳ v1.14 Phase 15: Homepage Redesign, Onboarding Flow, and Premium UI Refinement (Phases 87-91)</summary>

**Milestone Goal:** Refine STOA's first impression and core learning path with a magazine-style homepage, role-aware onboarding, AI-first chat flow, and a more premium, restrained education product UI.

- [ ] **Phase 87: Premium Homepage Story, Navigation, and Theme Direction** - Redesign the marketing homepage around a student-first magazine-style story and premium visual language.
- [ ] **Phase 88: Onboarding Contracts and Demo Backend Support** - Add typed onboarding contracts, registration payload support, tutor credential mock upload, and reset behavior.
- [ ] **Phase 89: Role-Based Registration and Onboarding UI** - Build the multi-step registration flow for student, parent, and tutor profiles with correct redirects.
- [ ] **Phase 90: AI-First Chat and Inline Teacher Escalation** - Refine chat entry, empty state, assistant feedback, and teacher request placement.
- [ ] **Phase 91: Phase 15 QA, Documentation, and Build Closure** - Update docs and QA artifacts, verify the demo flow, and close with build verification.

### Phase 87: Premium Homepage Story, Navigation, and Theme Direction

**Goal**: Replace the generic homepage/card presentation with a premium editorial STOA landing experience that makes the student path obvious.
**Depends on**: Phase 86
**Requirements**: [HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, UI-01, UI-02]
**Success Criteria** (what must be TRUE):
  1. Homepage hero uses magazine-style layout with a meaningful education image/mock visual and one dominant `Start Learning` CTA.
  2. Homepage no longer renders three equal AI/teacher/parent entry cards.
  3. A learning-flow section communicates AI-first help, teacher escalation, and parent progress in order.
  4. Marketing navigation keeps student entry prominent while preserving parent/tutor/pricing/login access at lower visual weight.
  5. Premium theme tokens and subtle transitions are applied without mobile text/image overlap.
**Plans**: 0/1

### Phase 88: Onboarding Contracts and Demo Backend Support

**Goal**: Extend the contract and demo backend for role-specific onboarding and tutor credential uploads without creating production backend debt.
**Depends on**: Phase 87
**Requirements**: [API-01, API-02, API-03, API-04, API-05]
**Success Criteria** (what must be TRUE):
  1. Onboarding TypeScript types model student, parent, and tutor profile payloads.
  2. Register API service accepts role-specific profile payloads and returns onboarding/parent/verification metadata.
  3. Tutor credential upload service and hook use service-layer API calls, not component-local URLs.
  4. Demo backend supports expanded `POST /auth/register` and `POST /files/tutor-credentials` mock behavior.
  5. Demo reset preserves fixed accounts and clears temporary onboarding/upload state.
**Plans**: 0/1

### Phase 89: Role-Based Registration and Onboarding UI

**Goal**: Build a clear multi-step onboarding path for students, parents, and tutors that routes users to the right role surface.
**Depends on**: Phase 88
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08]
**Success Criteria** (what must be TRUE):
  1. Login page exposes a clear create-account path and respects `next=/chat` routing.
  2. Register page starts with Student, Parent, and Tutor role selection and excludes Admin.
  3. Student, parent, and tutor profile steps collect the required role-specific fields.
  4. Tutor credential upload UI validates PDF/PNG/JPEG and 10 MB maximum files.
  5. Completion screen and redirect behavior match the returned role/onboarding status.
**Plans**: 0/1

### Phase 90: AI-First Chat and Inline Teacher Escalation

**Goal**: Make the chat workspace the direct student learning entry, with teacher help available only as contextual escalation after AI replies.
**Depends on**: Phase 89
**Requirements**: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05]
**Success Criteria** (what must be TRUE):
  1. Chat empty state invites the student to ask a homework question directly.
  2. Chat input placeholder uses homework-focused language.
  3. Assistant replies render an inline `Ask a human tutor` style action.
  4. Teacher request creation still uses existing service/hook behavior and remains visible to tutor/parent demo surfaces.
  5. The UI no longer treats teacher help as a standalone module on the student entry path.
**Plans**: 0/1

### Phase 91: Phase 15 QA, Documentation, and Build Closure

**Goal**: Close Phase 15 with updated usage documentation, QA coverage, and verified build.
**Depends on**: Phase 90
**Requirements**: [QA-01, QA-02, QA-03]
**Success Criteria** (what must be TRUE):
  1. README documents the Phase 15 homepage, onboarding, AI-first chat, and demo backend workflow.
  2. QA checklist covers homepage, role onboarding, tutor credential upload, chat escalation, demo reset, and mobile checks.
  3. Demo guide explains how to use the current Phase 15 demo from homepage to chat and role surfaces.
  4. `npm run build` passes after Phase 15 changes.
  5. Phase 15 requirements traceability is complete.
**Plans**: 0/1

</details>

<details>
<summary>✅ Previous shipped milestones (Phases 1-86)</summary>

Phases 1-86 shipped the STOA frontend foundation, product UI, backend chat integration, streaming/file uploads, authenticated roles, parent/tutor/admin MVP flows, staging/QA, production/pilot readiness, pricing validation, virtual checkout, launch-ready legal drafts, paid launch frontend, parent acquisition, referrals, tutor availability, support tickets, admin analytics, UTM tracking, platform/organization demos, learning-intelligence demos, curriculum graph UI, weak-point diagnosis UI, monthly parent report, retention UI, partnership onboarding, information architecture, route inventory, role-based navigation, breadcrumbs, page-flow helpers, mobile navigation, final demo flow, stable demo backend support, API mode configuration, real backend readiness, and AWS readiness notes.

See `.planning/MILESTONES.md` and archived milestone audit files for detailed shipped scope and verification evidence.

</details>

## Progress

**Execution Order:**
Phase 15 phases planned in numeric order: 87 -> 88 -> 89 -> 90 -> 91

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 87. Premium Homepage Story, Navigation, and Theme Direction | v1.14 | 0/1 | Planned | — |
| 88. Onboarding Contracts and Demo Backend Support | v1.14 | 0/1 | Planned | — |
| 89. Role-Based Registration and Onboarding UI | v1.14 | 0/1 | Planned | — |
| 90. AI-First Chat and Inline Teacher Escalation | v1.14 | 0/1 | Planned | — |
| 91. Phase 15 QA, Documentation, and Build Closure | v1.14 | 0/1 | Planned | — |

