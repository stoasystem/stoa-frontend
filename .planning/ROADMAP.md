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

## Phases

- [x] **Phase 153: Practice Interaction Research and Contract Definition** - Convert research into Phase 29 design constraints, docs, and frontend/demo context contracts.
- [x] **Phase 154: Practice Lesson Interaction Refinement** - Refine lesson start, challenge, feedback, hint, retry, result, and mistakes review interaction.
- [x] **Phase 155: Practice to Learning Chat Transition** - Add challenge-context handoff, Chat context card, and Back to lesson behavior.
- [x] **Phase 156: Practice to Teacher Support Escalation** - Add delayed teacher-support escalation and practice context for teacher requests.
- [x] **Phase 157: Learning Platform Entry IA and Parent Activity Integration** - Reorganize homepage, Student Dashboard, navigation, and Parent Report framing around unified learning activity.
- [x] **Phase 158: Localization, Demo QA, README, and Final Verification** - Add four-language labels, QA docs, integrated demo flow, README update, build, and browser smoke.

## Phase Details

### Phase 153: Practice Interaction Research and Contract Definition

**Goal**: Phase 29 has research-backed UI constraints and frontend/demo contracts before implementation starts.
**Depends on**: Phase 152
**Requirements**: SCOPE29-01, SCOPE29-02, SCOPE29-03, CHAT29-01, TEACH29-03, DOC29-01
**Success Criteria** (what must be TRUE):
  1. Research docs explain which Duolingo-style mechanics STOA adapts and which gamification patterns it avoids.
  2. Practice interaction docs define lesson start, challenge, feedback, hint, retry, result, and mistakes review behavior.
  3. `PracticeChatContext` and `PracticeTeacherRequestContext` contracts are documented and/or typed for frontend/demo use.
  4. Scope docs confirm no new curriculum, production backend, database, adaptive learning, or game-first features.
**Plans**: 153-PLAN.md
**UI hint**: yes

### Phase 154: Practice Lesson Interaction Refinement

**Goal**: Existing equation Practice lessons feel smoother, more stable, and easier to demonstrate.
**Depends on**: Phase 153
**Requirements**: PRACTICE29-01, PRACTICE29-02, PRACTICE29-03, PRACTICE29-04, PRACTICE29-05, PRACTICE29-06, PRACTICE29-07
**Success Criteria** (what must be TRUE):
  1. Lesson start screen sets expectations before the first challenge.
  2. Challenge screen uses stable layout for progress, prompt, answer control, attempts, and primary action.
  3. Correct and incorrect feedback panels are calm, specific, and visually stable.
  4. Hint and retry flow does not reveal the final answer first and does not cause large layout jumps.
  5. Lesson result and mistakes review provide clear next actions without failure language.
**Plans**: 154-PLAN.md
**UI hint**: yes

### Phase 155: Practice to Learning Chat Transition

**Goal**: A student who gets stuck in Practice can move into Learning Chat with context and return to the lesson.
**Depends on**: Phase 154
**Requirements**: CHAT29-02, CHAT29-03, CHAT29-04, CHAT29-05, CHAT29-06
**Success Criteria** (what must be TRUE):
  1. `Explain this step` opens Learning Chat with the active challenge context.
  2. Result and mistake review states can open Learning Chat with relevant practice context.
  3. Chat renders a practice context card instead of looking like a cold-start conversation.
  4. Chat provides `Back to lesson` when a return path is present.
  5. Visible copy uses Learning Assistant / Learning Chat language, not `AI help`.
**Plans**: 155-PLAN.md
**UI hint**: yes

### Phase 156: Practice to Teacher Support Escalation

**Goal**: Teacher support appears at the right time and carries useful practice context.
**Depends on**: Phase 155
**Requirements**: TEACH29-01, TEACH29-02, TEACH29-04, TEACH29-05
**Success Criteria** (what must be TRUE):
  1. First incorrect answer does not show teacher support as the primary next action.
  2. Repeated incorrect attempts, hint use, Learning Assistant explanation, or explicit stuck intent can reveal teacher support.
  3. Student-facing copy asks whether a teacher should explain the step without implying failure.
  4. Teacher/tutor request UI or mock context shows practice topic/challenge/attempt details when available.
**Plans**: 156-PLAN.md
**UI hint**: yes

### Phase 157: Learning Platform Entry IA and Parent Activity Integration

**Goal**: Practice and Learning Chat read as connected learning paths across homepage, dashboard, navigation, and parent report.
**Depends on**: Phase 156
**Requirements**: IA29-01, IA29-02, IA29-03, IA29-04, IA29-05, PARENT29-01, PARENT29-02, PARENT29-03
**Success Criteria** (what must be TRUE):
  1. Homepage entry copy explains that students can practice step by step or ask a question when stuck.
  2. Student navigation labels Dashboard, Practice, Learning Chat, History, and Profile clearly.
  3. Student Dashboard makes Continue Practice and Ask a question distinct but connected.
  4. Practice/Chat breadcrumbs or return behavior prevent students from feeling lost.
  5. Parent Report presents questions, practice, mistakes, teacher support, and next recommendations as one learning activity story.
**Plans**: 157-PLAN.md
**UI hint**: yes

### Phase 158: Localization, Demo QA, README, and Final Verification

**Goal**: Phase 29 is documented, localized, buildable, and demonstrable end to end.
**Depends on**: Phase 157
**Requirements**: LANG29-01, LANG29-02, QA29-01, QA29-02, README29-01
**Success Criteria** (what must be TRUE):
  1. EN/DE/FR/IT labels cover Explain this step, Ask in Learning Chat, Back to lesson, Ask a question, and teacher escalation copy.
  2. Multilingual labels fit mobile and desktop controls.
  3. QA docs cover Practice interaction, Practice-to-Chat, Practice-to-teacher, overall layout, parent report, and demo flow.
  4. Browser smoke covers Homepage -> Dashboard -> Practice -> hint -> Chat context -> Back to lesson -> completion -> Parent Report.
  5. `npm run build` passes and README includes Phase 29 guidance.
**Plans**: 158-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 153. Practice Interaction Research and Contract Definition | 1/1 | Complete | 2026-05-26 |
| 154. Practice Lesson Interaction Refinement | 1/1 | Complete | 2026-05-26 |
| 155. Practice to Learning Chat Transition | 1/1 | Complete | 2026-05-26 |
| 156. Practice to Teacher Support Escalation | 1/1 | Complete | 2026-05-26 |
| 157. Learning Platform Entry IA and Parent Activity Integration | 1/1 | Complete | 2026-05-26 |
| 158. Localization, Demo QA, README, and Final Verification | 1/1 | Complete | 2026-05-26 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 153 | 6 | SCOPE29-01, SCOPE29-02, SCOPE29-03, CHAT29-01, TEACH29-03, DOC29-01 |
| 154 | 7 | PRACTICE29-01, PRACTICE29-02, PRACTICE29-03, PRACTICE29-04, PRACTICE29-05, PRACTICE29-06, PRACTICE29-07 |
| 155 | 5 | CHAT29-02, CHAT29-03, CHAT29-04, CHAT29-05, CHAT29-06 |
| 156 | 4 | TEACH29-01, TEACH29-02, TEACH29-04, TEACH29-05 |
| 157 | 8 | IA29-01, IA29-02, IA29-03, IA29-04, IA29-05, PARENT29-01, PARENT29-02, PARENT29-03 |
| 158 | 5 | LANG29-01, LANG29-02, QA29-01, QA29-02, README29-01 |

**Total requirements:** 35
**Mapped requirements:** 35
**Unmapped requirements:** 0

## Next Up

Milestone v1.27 implementation is complete. Recommended next milestone: Phase 30 Final Demo Curriculum Packaging, External Testing, and Product Story Refinement.
