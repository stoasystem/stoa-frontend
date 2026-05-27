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
- 🔄 **v1.31 Phase 33: Homepage Practice Entry Clarification and Learning Platform Funnel Optimization** - Phases 177-180 (planned 2026-05-27)

## Phases

- [x] **Phase 177: Start Practice Funnel and Route Contract** - Define and implement the role-aware Start Practice route contract so the homepage CTA sends each user type to the correct destination.
- [x] **Phase 178: Homepage Practice Entry UI and Preview Components** - Build the clearer Practice entry card, preview, and CTA hierarchy using STOA's premium design language.
- [ ] **Phase 179: Four-Language Mobile Fit and Accessibility QA** - Localize and verify the Practice entry across English, German, French, and Italian with mobile, keyboard, and reduced-motion checks.
- [ ] **Phase 180: Demo Flow, Documentation, README, and Build Verification** - Document the homepage-to-Practice flow, update QA and README handoff, run demo verification, and confirm `npm run build`.

## Phase Details

### Phase 177: Start Practice Funnel and Route Contract

**Goal**: Homepage Start Practice has a correct, centralized route contract before UI polish or testing begins.
**Depends on**: Phase 176
**Requirements**: NAV33-01, NAV33-02, NAV33-03, NAV33-04, NAV33-05, NAV33-06, NAV33-07, NAV33-08, NAV33-09
**Success Criteria** (what must be TRUE):
  1. Homepage Start Practice is defined as a concrete Practice entry action, not only explanatory copy.
  2. Unauthenticated users are routed to `/login?next=/practice`.
  3. Authenticated students are routed to `/practice`.
  4. Authenticated parent, tutor, admin, and organization users are routed to their own role home pages.
  5. Student login honors safe `next=/practice` behavior, and registration behavior is documented.
**Plans**: 177-PLAN.md
**UI hint**: no

### Phase 178: Homepage Practice Entry UI and Preview Components

**Goal**: Homepage users can understand in one glance that Practice is a short learning entry that leads to hints, Learning Chat, teacher support, and parent visibility.
**Depends on**: Phase 177
**Requirements**: HOME33-01, HOME33-02, HOME33-03, HOME33-04, HOME33-05, HOME33-06, HOME33-07, HOME33-08, HOME33-09, HOME33-10, HOME33-11
**Success Criteria** (what must be TRUE):
  1. `HomePracticeEntry`, `PracticeEntryCard`, and `HomePracticePreview` exist and are wired into the homepage.
  2. The entry appears after Hero and before or inside the broader How STOA Works flow.
  3. The preview shows a concise equation path with one-step equations, quadratic basics, and linear systems.
  4. Copy explains short practice, hint-first recovery, and Learning Chat handoff without game-first or Duolingo-facing wording.
  5. CTA hierarchy keeps `Start Learning` primary, `Start Practice` clear but subordinate, and `How it works` secondary.
**Plans**: 178-PLAN.md
**UI hint**: yes

### Phase 179: Four-Language Mobile Fit and Accessibility QA

**Goal**: The Practice entry works across supported locales and viewports without layout, motion, or accessibility regressions.
**Depends on**: Phase 178
**Requirements**: L10N33-01, L10N33-02, L10N33-03, L10N33-04, L10N33-05, L10N33-06, L10N33-07, L10N33-08
**Success Criteria** (what must be TRUE):
  1. English, German, French, and Italian Practice entry copy and preview labels are present.
  2. German and French CTAs fit or wrap safely on mobile.
  3. Homepage Practice entry has no horizontal overflow at 320, 375, 430, 768, 1024, or 1440 CSS px where feasible.
  4. Keyboard focus order remains understandable through the Practice entry actions.
  5. Hover/reveal motion respects reduced-motion preferences.
**Plans**: 179-PLAN.md
**UI hint**: yes

### Phase 180: Demo Flow, Documentation, README, and Build Verification

**Goal**: Phase 33 is documented, verified, and ready to feed Phase 34 user testing.
**Depends on**: Phase 179
**Requirements**: DOC33-01, DOC33-02, DOC33-03, DOC33-04, DOC33-05, DOC33-06, DOC33-07, QA33-01, QA33-02, QA33-03, QA33-04, QA33-05, QA33-06, QA33-07, QA33-08
**Success Criteria** (what must be TRUE):
  1. Required homepage, Practice, IA, and demo docs exist and describe the Practice entry funnel.
  2. QA checklist covers Practice entry clarity, routing, layout, four-language fit, and product hierarchy.
  3. Demo flow records homepage -> Practice behavior for unauthenticated and authenticated users.
  4. README includes Phase 33 handoff and known Phase 34 follow-up.
  5. `npm run build` succeeds and any remaining gaps are recorded.
**Plans**: 180-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 177. Start Practice Funnel and Route Contract | 1/1 | Complete | 2026-05-27 |
| 178. Homepage Practice Entry UI and Preview Components | 1/1 | Complete | 2026-05-27 |
| 179. Four-Language Mobile Fit and Accessibility QA | 0/1 | Pending | — |
| 180. Demo Flow, Documentation, README, and Build Verification | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 177 | 9 | NAV33-01, NAV33-02, NAV33-03, NAV33-04, NAV33-05, NAV33-06, NAV33-07, NAV33-08, NAV33-09 |
| 178 | 11 | HOME33-01, HOME33-02, HOME33-03, HOME33-04, HOME33-05, HOME33-06, HOME33-07, HOME33-08, HOME33-09, HOME33-10, HOME33-11 |
| 179 | 8 | L10N33-01, L10N33-02, L10N33-03, L10N33-04, L10N33-05, L10N33-06, L10N33-07, L10N33-08 |
| 180 | 15 | DOC33-01, DOC33-02, DOC33-03, DOC33-04, DOC33-05, DOC33-06, DOC33-07, QA33-01, QA33-02, QA33-03, QA33-04, QA33-05, QA33-06, QA33-07, QA33-08 |

**Total requirements:** 43
**Mapped requirements:** 43
**Unmapped requirements:** 0

## Next Up

Phase 177: Start Practice Funnel and Route Contract.
