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

## Phases

- [x] **Phase 141: Reference Audit, Scope, and Practice Tone Lock** - Lock what STOA adapts from the reference repo and what stays excluded.
- [x] **Phase 142: Practice Contracts, Mock Data, Service Boundary, and State Model** - Establish typed practice data, demo fallback, query hooks, and deterministic lesson state.
- [x] **Phase 143: Student Practice Routes and Core Lesson Flow** - Let students enter Practice Path, complete demo lessons, review results, and revisit mistakes.
- [x] **Phase 144: Hint-First Learning Assistant and Teacher Support Handoff** - Connect practice mistakes to guided explanations and teacher escalation without provider leakage.
- [x] **Phase 145: Dashboard and Parent Practice Integration** - Surface practice progress as the next student action and as calm parent reporting.
- [x] **Phase 146: Localization, Accessibility, Documentation, and Verification** - Finish four-language copy, brand fit, accessibility, docs, README, and verification evidence.

## Phase Details

### Phase 141: Reference Audit, Scope, and Practice Tone Lock
**Goal**: Developers have a clear STOA-specific Practice Path scope, reference boundary, UI tone, and terminology before implementation starts.
**Depends on**: Phase 140
**Requirements**: REF27-01, SCOPE27-01, STYLE27-01, COPY27-01
**Success Criteria** (what must be TRUE):
  1. Developer can read the reference audit and see which learning-path, challenge, feedback, progress, retry, and completion mechanics STOA adapts.
  2. Developer can read the scope doc and see that Practice Path is frontend/demo-backed subject practice, not a language-learning clone or production course system.
  3. Designer or implementer can apply Practice UI guidelines that allow restrained progress and feedback while excluding cartoon, shop, leaderboard, gems, and hearts mechanics.
  4. Practice labels use neutral STOA terminology such as Practice Path, attempts, progress points, daily goal, study streak, hints, Learning Assistant explanation, and teacher support.
**Plans**: 141-PLAN.md
**UI hint**: yes

### Phase 142: Practice Contracts, Mock Data, Service Boundary, and State Model
**Goal**: Practice Path has a single typed data and service foundation for lessons, progress, answers, mistakes, summaries, and deterministic challenge transitions.
**Depends on**: Phase 141
**Requirements**: TYPE27-01, DATA27-01, DATA27-02, API27-01, API27-02, QUERY27-01, STATE27-01, MOCK27-01, BOUND27-01
**Success Criteria** (what must be TRUE):
  1. Developer can import typed Practice Path contracts for subjects, paths, lessons, challenges, answer results, lesson results, mistakes, overview, and parent summaries.
  2. Mathematics and Physics demo paths expose credible lessons with 3-5 challenges per lesson through one canonical mock data source.
  3. Practice service functions and query/mutation hooks match the documented API contract and can fall back to demo data without page-specific data duplication.
  4. Lesson progression supports answer selection, checking, feedback, retry, hint, continue, completion, and reset through deterministic local state or a reducer.
  5. Practice frontend code calls only STOA service/API boundaries and never model/provider APIs directly.
**Plans**: 142-SUMMARY.md

### Phase 143: Student Practice Routes and Core Lesson Flow
**Goal**: Students can navigate to Practice Path, choose a subject path, complete challenge-based lessons, view results, and review recent mistakes.
**Depends on**: Phase 142
**Requirements**: ROUTE27-01, OVERVIEW27-01, PATH27-01, LESSON27-01, CHAL27-01, CHAL27-02, CHAL27-03, FEED27-01, RESULT27-01, MISTAKE27-01, NAV27-01
**Success Criteria** (what must be TRUE):
  1. Authenticated student navigation exposes Practice alongside Dashboard, Chat, Learning History, and Profile, and `/practice` opens a Practice Overview.
  2. Student can view Mathematics and Physics subjects, recommended path, progress, daily goal, study streak, and recent weak topics.
  3. Student can open a subject path and understand available, locked, completed, and current lesson states with visible progress.
  4. Student can complete multiple-choice, text/numeric, ordering, or explanation challenges with attempts, checking, restrained feedback, retry, and continue controls.
  5. Student can review lesson results and recent mistakes, then continue practice, retry, request explanation, or return to the dashboard.
**Plans**: 143-SUMMARY.md
**UI hint**: yes

### Phase 144: Hint-First Learning Assistant and Teacher Support Handoff
**Goal**: Practice mistakes lead to feedback, hints, Learning Assistant explanations, and teacher support escalation in the right order.
**Depends on**: Phase 143
**Requirements**: HINT27-01, ASSIST27-01, ASSIST27-02, TEACH27-01
**Success Criteria** (what must be TRUE):
  1. Student sees incorrect-answer feedback and a hint/retry path before any stronger support action.
  2. Student can use `Explain this step` from a practice mistake and receive or open a Learning Assistant explanation with practice context.
  3. Learning Assistant explanation copy guides the next reasoning step and avoids giving the final answer first.
  4. Student can access `Ask a teacher` only after repeated confusion, explicit stuck intent, or weak-topic context.
  5. Practice support surfaces do not show `Ask AI`, provider names, model names, prompts, debug fields, or backend internals.
**Plans**: 144-SUMMARY.md
**UI hint**: yes

### Phase 145: Dashboard and Parent Practice Integration
**Goal**: Practice Path progress appears where students and parents already look for next actions and learning signals.
**Depends on**: Phase 144
**Requirements**: DASH27-01, PARENT27-01, PARENT27-02
**Success Criteria** (what must be TRUE):
  1. Student Dashboard shows a Continue Practice section with recommended lesson, daily goal, study streak, recent mistakes, and a CTA to `/practice`.
  2. Parent report shows lessons completed this week, topics practiced, mistakes reviewed, practice streak, and recommended next topic.
  3. Parent-facing copy stays supportive and avoids anxiety-inducing language about mistakes or practice needs.
  4. Dashboard and parent summaries stay consistent with the same practice overview and summary data used by Practice Path.
**Plans**: 145-SUMMARY.md
**UI hint**: yes

### Phase 146: Localization, Accessibility, Documentation, and Verification
**Goal**: Practice Path is ready for demo use across supported languages, accessible controls, brand-fit UI, documented handoff, and final verification.
**Depends on**: Phase 145
**Requirements**: LANG27-01, LANG27-02, LANG27-03, LANG27-04, UI27-01, A11Y27-01, DOC27-01, QA27-01, README27-01, VERIFY27-01
**Success Criteria** (what must be TRUE):
  1. English, German, French, and Italian Practice Path P0 copy exists for all required practice controls, feedback states, lesson completion, mistakes, daily goal, and study streak labels.
  2. German, French, and Italian core controls fit mobile layouts, including the required German, French, and Italian hint/explanation labels.
  3. Practice UI uses STOA premium theme styling with restrained progress, feedback, lesson-node hover, and completion states, without cartoon, shop, gems, or loud celebration patterns.
  4. Practice challenge controls are keyboard accessible, show visible focus states, expose correctness without color alone, and preserve readable button text across viewports.
  5. Practice demo-data docs, functional QA docs, README handoff, build verification, student practice smoke, parent report smoke, and available lint/E2E evidence are recorded.
**Plans**: 146-SUMMARY.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 141. Reference Audit, Scope, and Practice Tone Lock | 1/1 | Complete | 2026-05-26 |
| 142. Practice Contracts, Mock Data, Service Boundary, and State Model | 1/1 | Complete | 2026-05-26 |
| 143. Student Practice Routes and Core Lesson Flow | 1/1 | Complete | 2026-05-26 |
| 144. Hint-First Learning Assistant and Teacher Support Handoff | 1/1 | Complete | 2026-05-26 |
| 145. Dashboard and Parent Practice Integration | 1/1 | Complete | 2026-05-26 |
| 146. Localization, Accessibility, Documentation, and Verification | 1/1 | Complete | 2026-05-26 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 141 | 4 | REF27-01, SCOPE27-01, STYLE27-01, COPY27-01 |
| 142 | 9 | TYPE27-01, DATA27-01, DATA27-02, API27-01, API27-02, QUERY27-01, STATE27-01, MOCK27-01, BOUND27-01 |
| 143 | 11 | ROUTE27-01, OVERVIEW27-01, PATH27-01, LESSON27-01, CHAL27-01, CHAL27-02, CHAL27-03, FEED27-01, RESULT27-01, MISTAKE27-01, NAV27-01 |
| 144 | 4 | HINT27-01, ASSIST27-01, ASSIST27-02, TEACH27-01 |
| 145 | 3 | DASH27-01, PARENT27-01, PARENT27-02 |
| 146 | 10 | LANG27-01, LANG27-02, LANG27-03, LANG27-04, UI27-01, A11Y27-01, DOC27-01, QA27-01, README27-01, VERIFY27-01 |

**Total requirements:** 41
**Mapped requirements:** 41
**Unmapped requirements:** 0

## Next Up

Milestone v1.25 implementation is complete. Recommended next milestone: Phase 28 Practice Path QA, Lesson Content Refinement, and Demo Scenario Polishing.
