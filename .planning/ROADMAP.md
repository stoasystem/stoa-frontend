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

## Phases

- [x] **Phase 147: Equation Demo Scope and Path Framing** - Narrow Practice Path demo to a Mathematics equation path and document the frontend/demo boundary.
- [x] **Phase 148: Equation Lesson Content and Mock Data** - Design the three equation units and update mock data for lower-secondary lesson progression.
- [x] **Phase 149: Challenge Difficulty, Feedback, and Hint Copy Polish** - Make challenges, feedback, hints, mistakes, and results educationally clear.
- [x] **Phase 150: Practice Support Behavior QA** - Verify hint-first Learning Assistant and teacher escalation behavior inside Practice.
- [x] **Phase 151: Parent Practice Summary and Demo Scenario** - Improve parent-facing practice language and document the 3-5 minute demo route.
- [x] **Phase 152: Localization, QA, README, and Final Verification** - Finish four-language labels, content QA, README, build, and smoke evidence.

## Phase Details

### Phase 147: Equation Demo Scope and Path Framing
**Goal**: Practice Path is clearly framed as an equation-only frontend demo for Phase 28.
**Depends on**: Phase 146
**Requirements**: SCOPE28-01, SCOPE28-02, SCOPE28-03, SCOPE28-04
**Success Criteria** (what must be TRUE):
  1. Developer can read `equation-practice-path.md` and see that Phase 28 demo content is only Mathematics equations.
  2. UI/demo copy does not present Physics, geometry, probability, functions, or broad curriculum paths as Phase 28 scope.
  3. First-screen Practice content makes the equation demo focus obvious.
  4. Docs clearly state frontend/demo-only boundaries and exclude real backend, database, adaptive learning, and full curriculum work.
**Plans**: 147-PLAN.md
**UI hint**: yes

### Phase 148: Equation Lesson Content and Mock Data
**Goal**: The equation path has credible lower-secondary lesson content and deterministic mock data.
**Depends on**: Phase 147
**Requirements**: LINEAR28-01, LINEAR28-02, QUAD28-01, QUAD28-02, SYSTEM28-01, SYSTEM28-02, DATA28-01, DATA28-02
**Success Criteria** (what must be TRUE):
  1. Unit 1 covers one-step equations, two-step equations, brackets, and word problems.
  2. Unit 2 covers recognizing quadratics, simple factoring, solving factored quadratics, and checking two solutions without advanced quadratic topics.
  3. Unit 3 covers systems meaning, substitution, elimination, and checking a solution.
  4. `mockPractice.ts` exposes the equation units and 3-5 focused challenges per lesson.
  5. Each challenge has an unambiguous answer and stays within lower-secondary demo difficulty.
**Plans**: 148-PLAN.md
**UI hint**: yes

### Phase 149: Challenge Difficulty, Feedback, and Hint Copy Polish
**Goal**: Practice challenges teach the next step clearly without giving away answers or sounding punitive.
**Depends on**: Phase 148
**Requirements**: DIFF28-01, DIFF28-02, FEED28-01, FEED28-02, FEED28-03, HINT28-01, MISTAKE28-01, RESULT28-01
**Success Criteria** (what must be TRUE):
  1. Challenge difficulty follows recognition, simple calculation, step selection, full solution, and optional review progression.
  2. Correct feedback names the useful reasoning step.
  3. Incorrect feedback is supportive and points to the next operation or idea without revealing the full answer.
  4. Hints are short, directional, and age-appropriate.
  5. Mistake review and result copy explain what to practice next without failure language or loud reward language.
**Plans**: 149-PLAN.md
**UI hint**: yes

### Phase 150: Practice Support Behavior QA
**Goal**: Practice support preserves hint-first Learning Assistant behavior and teacher escalation boundaries.
**Depends on**: Phase 149
**Requirements**: ASSIST28-01, ASSIST28-02, ASSIST28-03, TEACH28-01, BOUND28-01
**Success Criteria** (what must be TRUE):
  1. `Explain this step` uses current challenge context.
  2. Practice explanation copy guides the next step before revealing a final answer.
  3. Repeated incorrect attempts can show more specific support without skipping directly to teacher support.
  4. `Ask a teacher` appears only after repeated confusion, stuck intent, or weak-topic context.
  5. Practice frontend code stays behind STOA service/API boundaries and does not call provider APIs.
**Plans**: 150-PLAN.md
**UI hint**: yes

### Phase 151: Parent Practice Summary and Demo Scenario
**Goal**: Parents can understand equation practice progress, and the team has a tight 3-5 minute demo route.
**Depends on**: Phase 150
**Requirements**: PARENT28-01, PARENT28-02, PARENT28-03, DEMO28-01, DEMO28-02
**Success Criteria** (what must be TRUE):
  1. Parent copy documentation defines supportive wording for current path, completed lessons, topics practiced, mistakes reviewed, and next topic.
  2. Parent Report practice summary aligns with the equation-only demo data.
  3. Parent-facing copy avoids failure, weakness, ranking, or anxiety language.
  4. Demo scenario shows Dashboard -> Practice -> path -> lesson -> correct answer -> incorrect answer -> hint -> explanation -> result -> Parent Report.
  5. The documented demo route can be completed in 3-5 minutes.
**Plans**: 151-PLAN.md
**UI hint**: yes

### Phase 152: Localization, QA, README, and Final Verification
**Goal**: Phase 28 is ready to execute with complete QA, docs, README, and verification expectations.
**Depends on**: Phase 151
**Requirements**: LANG28-01, LANG28-02, QA28-01, QA28-02, README28-01, VERIFY28-01
**Success Criteria** (what must be TRUE):
  1. English, German, French, and Italian Practice labels exist for core controls and feedback states.
  2. German, French, and Italian core labels fit the existing mobile control surfaces.
  3. Content QA covers scope, lesson goals, challenge clarity, answer correctness, hints, feedback, Learning Assistant behavior, and parent copy.
  4. Final QA includes build, equation lesson smoke, Learning Assistant support smoke, parent report smoke, and demo scenario smoke.
  5. README documents Phase 28 scope, exclusions, equation topics, and main tasks.
**Plans**: 152-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 147. Equation Demo Scope and Path Framing | 1/1 | Complete | 2026-05-26 |
| 148. Equation Lesson Content and Mock Data | 1/1 | Complete | 2026-05-26 |
| 149. Challenge Difficulty, Feedback, and Hint Copy Polish | 1/1 | Complete | 2026-05-26 |
| 150. Practice Support Behavior QA | 1/1 | Complete | 2026-05-26 |
| 151. Parent Practice Summary and Demo Scenario | 1/1 | Complete | 2026-05-26 |
| 152. Localization, QA, README, and Final Verification | 1/1 | Complete | 2026-05-26 |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 147 | 4 | SCOPE28-01, SCOPE28-02, SCOPE28-03, SCOPE28-04 |
| 148 | 8 | LINEAR28-01, LINEAR28-02, QUAD28-01, QUAD28-02, SYSTEM28-01, SYSTEM28-02, DATA28-01, DATA28-02 |
| 149 | 8 | DIFF28-01, DIFF28-02, FEED28-01, FEED28-02, FEED28-03, HINT28-01, MISTAKE28-01, RESULT28-01 |
| 150 | 5 | ASSIST28-01, ASSIST28-02, ASSIST28-03, TEACH28-01, BOUND28-01 |
| 151 | 5 | PARENT28-01, PARENT28-02, PARENT28-03, DEMO28-01, DEMO28-02 |
| 152 | 6 | LANG28-01, LANG28-02, QA28-01, QA28-02, README28-01, VERIFY28-01 |

**Total requirements:** 36
**Mapped requirements:** 36
**Unmapped requirements:** 0

## Next Up

Milestone v1.26 implementation is complete. Recommended next milestone: Phase 29 Practice Path Demo Rehearsal, Parent Value Framing, and Learning Report Integration.
