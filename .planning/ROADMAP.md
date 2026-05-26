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
- 🔄 **v1.28 Phase 30: Final Demo Curriculum Packaging, External Testing, and Product Story Refinement** - Phases 159-164 (planned 2026-05-26)

## Phases

- [x] **Phase 159: Final Demo Curriculum Package** - Lock and document the equation-focused demo curriculum package and its limitations.
- [x] **Phase 160: Integrated Product Story and Demo Scripts** - Package Practice, Learning Chat, teacher support, and Parent Report into 3, 10, and 15 minute demo narratives.
- [ ] **Phase 161: External Testing Task Sheets and Plan** - Prepare student, parent, tutor, stakeholder, and internal-review testing materials.
- [ ] **Phase 162: Feedback Collection and Evaluation Framework** - Define structured feedback forms, role-specific questions, severity tags, and follow-up handling.
- [ ] **Phase 163: Parent Value Framing and Future Handoff Requirements** - Refine parent-facing value language and document future curriculum/backend/backlog needs.
- [ ] **Phase 164: README, Demo QA, and Milestone Handoff** - Update README, verify the existing demo flow, run build, and summarize risks and next steps.

## Phase Details

### Phase 159: Final Demo Curriculum Package

**Goal**: The equation-focused final demo curriculum is clearly packaged, scoped, and limited.
**Depends on**: Phase 158
**Requirements**: CURR30-01, CURR30-02, CURR30-03, CURR30-04, CURR30-05
**Success Criteria** (what must be TRUE):
  1. `docs/curriculum/final-demo-curriculum-package/` contains overview, equation path summary, unit demo docs, flow docs, parent report summary, limitations, and future curriculum requirements.
  2. The package locks the demo to lower-secondary Mathematics equations and excludes geometry, probability, physics, trigonometry, calculus, advanced functions, and broad course libraries.
  3. Unit summaries explain linear equations, quadratic equations, and linear systems in terms that students, parents, and teachers can understand.
  4. The rationale for choosing equations is clear and suitable for external demo narration.
  5. Demo limitations are explicit and do not weaken the core story by overclaiming real curriculum coverage.
**Plans**: 159-PLAN.md
**UI hint**: no

### Phase 160: Integrated Product Story and Demo Scripts

**Goal**: STOA's existing Practice, Chat, teacher support, and Parent Report surfaces read as one product story.
**Depends on**: Phase 159
**Requirements**: STORY30-01, STORY30-02, STORY30-03, STORY30-04, STORY30-05
**Success Criteria** (what must be TRUE):
  1. A single product story statement exists in English, German, French, and Italian or is ready for localization.
  2. A 10-minute script covers Homepage, Dashboard, Practice, mistake, hint, Explain this step, Learning Chat, teacher support, and Parent Report.
  3. A 3-minute script covers the fastest credible Practice -> hint -> Learning Chat -> Parent Report narrative.
  4. A 15-minute stakeholder script explains positioning, student value, parent value, teacher support, learning data, pricing/growth direction, and roadmap boundaries.
  5. Scripts avoid internal terms such as mock, demo backend, provider names, debug labels, and implementation details.
**Plans**: 160-PLAN.md
**UI hint**: no

### Phase 161: External Testing Task Sheets and Plan

**Goal**: External testers can exercise the final demo consistently by role.
**Depends on**: Phase 160
**Requirements**: TEST30-01, TEST30-02, TEST30-03, TEST30-04, TEST30-05
**Success Criteria** (what must be TRUE):
  1. External testing plan defines tester groups, goals, session setup, timing, facilitation notes, and success signals.
  2. Student task sheet walks through Dashboard -> Practice -> intentional mistake -> hint -> Explain this step -> Chat -> back to lesson -> completion.
  3. Parent task sheet walks through child overview/report and asks the tester to interpret learning activity, questions, teacher support, and recommendations.
  4. Tutor task sheet walks through a Practice-origin request and context sufficiency review.
  5. Internal reviewer checklist supports 3, 10, and 15 minute rehearsal passes.
**Plans**: 161-PLAN.md
**UI hint**: no

### Phase 162: Feedback Collection and Evaluation Framework

**Goal**: Feedback from students, parents, tutors, and stakeholders can be captured and triaged consistently.
**Depends on**: Phase 161
**Requirements**: FEED30-01, FEED30-02, FEED30-03, FEED30-04, FEED30-05
**Success Criteria** (what must be TRUE):
  1. Feedback form covers clarity, ease of use, learning value, trust, parent visibility, teacher support, visual design, language clarity, confusing moments, and suggestions.
  2. Student questions test next-step clarity, hint usefulness, explanation usefulness, homework relevance, and teacher-support timing.
  3. Parent questions test report comprehension, value, trust, at-home visibility, and missing information.
  4. Tutor questions test context sufficiency, student struggle visibility, workflow clarity, and teaching efficiency.
  5. Feedback triage guidance separates observation, severity, audience, follow-up, and Phase 31 backlog candidate status.
**Plans**: 162-PLAN.md
**UI hint**: no

### Phase 163: Parent Value Framing and Future Handoff Requirements

**Goal**: Parent-facing value and future implementation needs are documented without expanding Phase 30 product scope.
**Depends on**: Phase 162
**Requirements**: PARENT30-01, PARENT30-02, PARENT30-03, PARENT30-04, FUTURE30-01, FUTURE30-02, FUTURE30-03, FUTURE30-04
**Success Criteria** (what must be TRUE):
  1. Parent value framing explains Practice and Chat as one learning activity with supportive language.
  2. Parent report guidance covers what the child practised, what is improving, what still benefits from practice, when Learning Assistant helped, and when teacher support may help.
  3. Parent copy rules explicitly reject failure, weakness, ranking, and anxiety wording.
  4. Future curriculum requirements define how to expand beyond equations later without broadening Phase 30.
  5. Future backend integration requirements cover persisted progress, Practice-to-Chat context, teacher request context, feedback capture, and reporting data.
  6. Next-iteration backlog separates Phase 31 demo refinements from later real product/backend/curriculum work.
**Plans**: 163-PLAN.md
**UI hint**: no

### Phase 164: README, Demo QA, and Milestone Handoff

**Goal**: Phase 30 is documented, verified, and ready to move into external testing or Phase 31 demo rehearsal.
**Depends on**: Phase 163
**Requirements**: DOC30-01, DOC30-02, QA30-01, QA30-02, QA30-03
**Success Criteria** (what must be TRUE):
  1. Required curriculum, testing, feedback, demo, and handoff documents exist in their requested directories.
  2. README explains Phase 30 scope, product story, external testing plan, exclusions, and next milestone entry.
  3. Verification confirms the existing Practice -> Hint -> Learning Chat -> Teacher Support -> Parent Report story remains coherent.
  4. `npm run build` passes.
  5. Final handoff records remaining risks, external-testing assumptions, and the reason no new feature scope was added.
**Plans**: 164-PLAN.md
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 159. Final Demo Curriculum Package | 1/1 | Complete | 2026-05-26 |
| 160. Integrated Product Story and Demo Scripts | 1/1 | Complete | 2026-05-26 |
| 161. External Testing Task Sheets and Plan | 0/1 | Pending | — |
| 162. Feedback Collection and Evaluation Framework | 0/1 | Pending | — |
| 163. Parent Value Framing and Future Handoff Requirements | 0/1 | Pending | — |
| 164. README, Demo QA, and Milestone Handoff | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 159 | 5 | CURR30-01, CURR30-02, CURR30-03, CURR30-04, CURR30-05 |
| 160 | 5 | STORY30-01, STORY30-02, STORY30-03, STORY30-04, STORY30-05 |
| 161 | 5 | TEST30-01, TEST30-02, TEST30-03, TEST30-04, TEST30-05 |
| 162 | 5 | FEED30-01, FEED30-02, FEED30-03, FEED30-04, FEED30-05 |
| 163 | 8 | PARENT30-01, PARENT30-02, PARENT30-03, PARENT30-04, FUTURE30-01, FUTURE30-02, FUTURE30-03, FUTURE30-04 |
| 164 | 5 | DOC30-01, DOC30-02, QA30-01, QA30-02, QA30-03 |

**Total requirements:** 33
**Mapped requirements:** 33
**Unmapped requirements:** 0

## Next Up

**Phase 159: Final Demo Curriculum Package** — Lock and document the equation-focused demo curriculum package and its limitations.

`$gsd-plan-phase 159`
