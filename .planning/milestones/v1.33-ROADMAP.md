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
- ✅ **v1.22 Phase 23: Launch Candidate Bug Fixing, Final Approval, and Public Demo Release** - Phases 128-132 (shipped 2026-05-26)
- ✅ **v1.23 Phase 25: Local Codex Provider Integration for Complete Demo Flow** - Phases 133-136 (shipped 2026-05-26)
- ✅ **v1.24 Phase 26: Learning Assistant Functional QA, Multi-Turn Behavior Testing, and Bug Fixing** - Phases 137-140 (shipped 2026-05-26)
- ✅ **v1.25 Phase 27: Duolingo-Style Learning Quest Integration and Practice Flow Design** - Phases 141-146 (implemented 2026-05-26)
- ✅ **v1.26 Phase 28: Practice Path QA, Equation Lesson Design, and Demo Scenario Polishing** - Phases 147-152 (implemented 2026-05-26)
- ✅ **v1.27 Phase 29: Practice Path Interaction Refinement, Learning Platform Entry Flow, and Site Layout Reorganization** - Phases 153-158 (implemented 2026-05-26)
- ✅ **v1.28 Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement** - Phases 159-164 (shipped 2026-05-26)
- ✅ **v1.29 Phase 31: Practice Game Entry Integration, Homepage Positioning, and Learning Platform Funnel Alignment** - Phases 165-170 (implemented 2026-05-27)
- ✅ **v1.30 Phase 32: Cross-Locale Language QA, Copy Accuracy Review, and Development Artifact Audit** - Phases 171-176 (implemented 2026-05-27)
- ✅ **v1.31 Phase 33: Homepage Practice Entry Clarification and Learning Platform Funnel Optimization** - Phases 177-180 (implemented 2026-05-27)
- ✅ **v1.32 Phase 34: Practice Path General Scope Correction and Subject-Agnostic Architecture Alignment** - Phases 181-185 (implemented 2026-05-27)
- ✅ **v1.33 Phase 35: Practice Roadmap UI, Lesson Progression, and Challenge Journey Experience** - Phases 186-190 (implemented 2026-05-27)

## Phases

- [x] **Phase 186: Practice Roadmap Data Contract and Demo Roadmap Foundation** - Define roadmap types, demo data, service contract, and query hook foundation for subject-agnostic Practice roadmaps.
- [x] **Phase 187: Roadmap Component System and Lesson Node States** - Build reusable roadmap components, lesson nodes, connectors, progress header, unlock hint, and next-lesson card with stable status rendering.
- [x] **Phase 188: Practice Roadmap Page Integration and Lesson Progression Flow** - Integrate the roadmap into `/practice` and topic routes, wire available/current/completed/locked click behavior, and support mock progression updates.
- [x] **Phase 189: Roadmap Visual Design, Localization, and Documentation** - Polish desktop/mobile roadmap layout, add four-language roadmap copy, and document UI rules, node rules, mobile layout, demo data, and QA.
- [x] **Phase 190: Practice Roadmap QA, README Handoff, and Build Verification** - Verify roadmap interaction, localization fit, desktop/mobile layouts, docs, README, and final build.

## Phase Details

### Phase 186: Practice Roadmap Data Contract and Demo Roadmap Foundation

**Goal**: Practice has a subject-agnostic roadmap data layer for Mathematics / lower secondary / equations demo content without locking the product to equations.
**Depends on**: Phase 185
**Requirements**: DATA35-01, DATA35-02, DATA35-03, DATA35-04, DATA35-05, DATA35-06, DATA35-07, DATA35-08, DOC35-04
**Success Criteria** (what must be TRUE):
  1. Roadmap types include topic, roadmap, unit, lesson, and lesson status contracts.
  2. Demo roadmap data represents Mathematics / lower secondary / Equations with multiple units and lesson statuses.
  3. Future API contract shape for `GET /practice/:subjectId/:topicId/roadmap` is documented or represented in service code.
  4. A Practice roadmap query/hook can load the demo roadmap through existing frontend patterns.
  5. Docs explain the demo data and subject-agnostic expansion model.
**Plans**: 186-PLAN.md
**UI hint**: no

### Phase 187: Roadmap Component System and Lesson Node States

**Goal**: Reusable Practice roadmap components can render lesson nodes, connectors, progress context, unlock hints, and continue cards with clear node states.
**Depends on**: Phase 186
**Requirements**: COMP35-01, COMP35-02, COMP35-03, COMP35-04, COMP35-05, COMP35-06, COMP35-07, NODE35-01, NODE35-05, NODE35-06, NODE35-07, NODE35-08
**Success Criteria** (what must be TRUE):
  1. `PracticeRoadmap` renders a full topic roadmap from units and lessons.
  2. Unit sections, lesson nodes, connectors, progress header, unlock hint, and continue card components exist.
  3. Completed, current, available, locked, and review states render distinctly.
  4. Locked lesson nodes expose unlock-condition UI without starting a lesson.
  5. The current lesson is visually highlighted without unstable layout shifts.
**Plans**: 187-PLAN.md
**UI hint**: yes

### Phase 188: Practice Roadmap Page Integration and Lesson Progression Flow

**Goal**: Students can use the roadmap from `/practice` and the topic page to continue, start, review, and progress through available demo lessons.
**Depends on**: Phase 187
**Requirements**: ROAD35-01, ROAD35-02, ROAD35-03, ROAD35-04, ROAD35-05, ROAD35-06, ROAD35-07, NODE35-02, NODE35-03, NODE35-04, NODE35-09
**Success Criteria** (what must be TRUE):
  1. `/practice` shows roadmap-style Practice path content and a current recommended path.
  2. `/practice/:subjectId/:topicId` shows a topic roadmap for Mathematics / Equations.
  3. Students can continue the current lesson, start available lessons, and review completed lessons.
  4. Mock lesson completion can update the visible roadmap state enough to demonstrate progression.
  5. Roadmap page copy connects unclear lesson steps to Learning Chat.
**Plans**: 188-PLAN.md
**UI hint**: yes

### Phase 189: Roadmap Visual Design, Localization, and Documentation

**Goal**: The roadmap feels like a calm STOA learning path on desktop and mobile, with four-language copy and durable documentation.
**Depends on**: Phase 188
**Requirements**: ROAD35-08, COMP35-08, COMP35-09, COMP35-10, DOC35-01, DOC35-02, DOC35-03, DOC35-05, LOC35-01, LOC35-02
**Success Criteria** (what must be TRUE):
  1. Desktop roadmap has clear progression through stable connectors and restrained node offset.
  2. Mobile roadmap remains readable as a simpler vertical path.
  3. Long localized text fits inside roadmap nodes, cards, and CTAs.
  4. English, German, French, and Italian roadmap labels exist for title, current lesson, locked hint, and continue action.
  5. Roadmap UI, node status, mobile layout, and QA docs exist.
**Plans**: 189-PLAN.md
**UI hint**: yes

### Phase 190: Practice Roadmap QA, README Handoff, and Build Verification

**Goal**: The completed Practice roadmap is verified, documented, and ready for the next milestone's interaction QA and parent-visibility refinement.
**Depends on**: Phase 189
**Requirements**: QA35-01, QA35-02, QA35-03
**Success Criteria** (what must be TRUE):
  1. `npm run build` succeeds.
  2. UI checks cover `/practice`, topic roadmap, lesson node clicks, locked hint, continue CTA, desktop layout, and mobile layout.
  3. README explains the roadmap-style Practice path and Mathematics / Equations demo scope.
  4. QA evidence records completed/current/available/locked states and progression behavior.
  5. Phase 36 follow-up is documented for roadmap interaction QA, progress feedback, and parent visibility refinement.
**Plans**: 190-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 186. Practice Roadmap Data Contract and Demo Roadmap Foundation | 1/1 | Complete | 2026-05-27 |
| 187. Roadmap Component System and Lesson Node States | 1/1 | Complete | 2026-05-27 |
| 188. Practice Roadmap Page Integration and Lesson Progression Flow | 1/1 | Complete | 2026-05-27 |
| 189. Roadmap Visual Design, Localization, and Documentation | 1/1 | Complete | 2026-05-27 |
| 190. Practice Roadmap QA, README Handoff, and Build Verification | 1/1 | Complete | 2026-05-27 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 186 | 9 | DATA35-01, DATA35-02, DATA35-03, DATA35-04, DATA35-05, DATA35-06, DATA35-07, DATA35-08, DOC35-04 |
| 187 | 12 | COMP35-01, COMP35-02, COMP35-03, COMP35-04, COMP35-05, COMP35-06, COMP35-07, NODE35-01, NODE35-05, NODE35-06, NODE35-07, NODE35-08 |
| 188 | 11 | ROAD35-01, ROAD35-02, ROAD35-03, ROAD35-04, ROAD35-05, ROAD35-06, ROAD35-07, NODE35-02, NODE35-03, NODE35-04, NODE35-09 |
| 189 | 10 | ROAD35-08, COMP35-08, COMP35-09, COMP35-10, DOC35-01, DOC35-02, DOC35-03, DOC35-05, LOC35-01, LOC35-02 |
| 190 | 3 | QA35-01, QA35-02, QA35-03 |

**Total requirements:** 45
**Mapped requirements:** 45
**Unmapped requirements:** 0

## Next Up

Phase 36 should focus on roadmap interaction QA, progress feedback, and parent visibility refinement.
