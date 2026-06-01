# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.34 Phase 36: Engineering Quality, CI Reliability, and Local Workflow Hardening** - Phases 191-194 (shipped 2026-05-27)
- ✅ **v1.35 Phase 37: Student Language Preference and Learning Assistant Response Localization** - Phases 195-199 (shipped 2026-06-01)
- ○ **v2.1 Question Bank UI Design** - Phases 200-205 (planned)

## Phases

- [ ] **Phase 200: Question Bank Data Model, Routes, and UI Foundation** - Establish typed mock data, service/query boundaries, route helpers, page shells, and the Question Bank product/design contract.
- [ ] **Phase 201: Question Bank Discovery, Search, Filters, and Navigation** - Add student navigation plus home, subject, and topic discovery surfaces with local search and filters.
- [ ] **Phase 202: Question Set Overview, Metadata, and Start/Resume Actions** - Add set overview pages with skills, type breakdown, status-aware actions, last-attempt summaries, and help framing.
- [ ] **Phase 203: Question Session UI, Answer Inputs, and Feedback Loop** - Add low-pressure question session flow with supported question types, answer checking, feedback states, and session navigation.
- [ ] **Phase 204: Results, Mistakes Review, and Learning Context Handoffs** - Add result and mistakes-review flows plus Chat, parent, and tutor context integration.
- [ ] **Phase 205: Localization, Accessibility, Responsive QA, and Handoff** - Complete four-language copy, accessibility/responsive verification, internal-term scan, docs, and final quality gates.

## Phase Details

### Phase 200: Question Bank Data Model, Routes, and UI Foundation

**Goal**: Developers have a clean Question Bank foundation with typed deterministic data, replaceable services, protected route structure, and a UI/design contract that keeps Question Bank distinct from Practice Path.
**Depends on**: Phase 199
**Requirements**: QBIA-02, QBIA-03, QBIA-04, QBQA-01, QBQA-02
**Success Criteria** (what must be TRUE):
  1. `src/types/questionBank.ts` defines subjects, topics, sets, questions, sessions, answers, feedback, results, mistakes, and filters.
  2. `src/data/mockQuestionBank.ts` provides deterministic demo data for all core v2.1 flows.
  3. `src/services/questionBank/*`, query keys, and hooks expose replaceable API boundaries.
  4. Protected route definitions and route helpers cover all core Question Bank routes without disrupting existing routes.
  5. UI/design notes define Question Bank as a flexible exercise library, not a Practice Path roadmap clone.
**Plans**: 200-PLAN.md
**UI hint**: yes

### Phase 201: Question Bank Discovery, Search, Filters, and Navigation

**Goal**: Students can find useful practice through Question Bank home, subject, and topic pages using search, filters, progress cues, and clear navigation.
**Depends on**: Phase 200
**Requirements**: QBIA-01, QBIA-05, QBDISC-01, QBDISC-02, QBDISC-03, QBDISC-04, QBDISC-05, QBDISC-06, QBDISC-07
**Success Criteria** (what must be TRUE):
  1. Authenticated student navigation includes Question Bank near Practice and Learning Chat.
  2. Question Bank home shows search, continue practice, subject cards, recommended sets, mistakes review, and recent practice.
  3. Subject pages show progress, grade/level filters, difficulty filters, topic cards, and recommended sets.
  4. Topic pages show progress, weak areas, filters, question-set list, and related Practice Path CTA.
  5. Search and filters work locally, keep active filters visible, support reset, and remain usable on mobile.
**Plans**: 201-PLAN.md
**UI hint**: yes

### Phase 202: Question Set Overview, Metadata, and Start/Resume Actions

**Goal**: Students can inspect a question set before starting, understand its scope and history, and choose the correct status-aware action.
**Depends on**: Phase 201
**Requirements**: QBSET-01, QBSET-02, QBSET-03, QBSET-04, QBSET-05, QBSET-06
**Success Criteria** (what must be TRUE):
  1. Question set overview is reachable from recommended sets, topic lists, recent practice, saved sets, and mistakes context.
  2. Overview displays title, description, question count, difficulty, estimated time, subject, level, and status.
  3. Skills covered and question-type breakdown are visible and scannable.
  4. Last-attempt summary appears when mock attempt history exists.
  5. Actions correctly switch between Start, Resume, Practice Again, and Review, with Learning Assistant help framed as available after questions.
**Plans**: 202-PLAN.md
**UI hint**: yes

### Phase 203: Question Session UI, Answer Inputs, and Feedback Loop

**Goal**: Students can complete a mock question-bank session with multiple question types, immediate feedback, low-pressure navigation, and finish safeguards.
**Depends on**: Phase 202
**Requirements**: QBSESS-01, QBSESS-02, QBSESS-03, QBSESS-04, QBSESS-05, QBSESS-06, QBSESS-07, QBSESS-08, QBSESS-09, QBSESS-10
**Success Criteria** (what must be TRUE):
  1. Start/resume creates or loads a mock session and opens the session route.
  2. Session page shows set title, progress, prompt, answer input, check/skip actions, feedback, Learning Assistant CTA, and previous/next controls.
  3. Multiple-choice, short-answer, numeric-answer, and step-by-step UI layouts render correctly.
  4. Feedback supports idle, checking, correct, incorrect, partially correct, and skipped states.
  5. Correct/incorrect/skipped feedback uses concise learning copy, and finishing with unanswered questions offers review or finish-anyway choices.
**Plans**: 203-PLAN.md
**UI hint**: yes

### Phase 204: Results, Mistakes Review, and Learning Context Handoffs

**Goal**: Students can understand session outcomes, review mistakes, continue into Practice Path, and pass question-bank context into Learning Chat, parent, and tutor surfaces.
**Depends on**: Phase 203
**Requirements**: QBRES-01, QBRES-02, QBRES-03, QBRES-04, QBRES-05, QBRES-06, QBRES-07, QBCTX-01, QBCTX-02, QBCTX-03, QBCTX-04
**Success Criteria** (what must be TRUE):
  1. Finishing a set opens a result page with score, time, topic accuracy, incorrect/skipped questions, and next steps.
  2. Result page supports Retry Mistakes and Continue to Practice Path actions.
  3. Mistakes review page shows summary, subject/topic/difficulty filters, mistake list, and Start Review Session.
  4. Review sessions reuse the low-pressure feedback model.
  5. Learning Chat, parent activity, and tutor context can display product-safe question-bank context without internal terminology.
**Plans**: 204-PLAN.md
**UI hint**: yes

### Phase 205: Localization, Accessibility, Responsive QA, and Handoff

**Goal**: Question Bank is localized, accessible, responsive, documented, and verified through standard frontend quality gates and browser smoke checks.
**Depends on**: Phase 204
**Requirements**: QBCTX-05, QBQA-03, QBQA-04, QBQA-05, QBQA-06, QBQA-07, QBQA-08
**Success Criteria** (what must be TRUE):
  1. English, German, French, and Italian Question Bank copy is present and product-safe.
  2. Documentation explains Question Bank, Practice Path, Learning Chat, Professional Teacher Support, and Parent Report relationships.
  3. Keyboard access, labels, focus states, result/feedback announcements, and responsive layouts are checked.
  4. Internal-term scan covers visible Question Bank UI for demo/mock/backend/provider terminology.
  5. `npm run lint`, `npm run build`, and browser smoke checks pass for home, subject, topic, set overview, session, result, mistakes review, and Chat handoff paths.
**Plans**: 205-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 200. Question Bank Data Model, Routes, and UI Foundation | 0/1 | Pending | — |
| 201. Question Bank Discovery, Search, Filters, and Navigation | 0/1 | Pending | — |
| 202. Question Set Overview, Metadata, and Start/Resume Actions | 0/1 | Pending | — |
| 203. Question Session UI, Answer Inputs, and Feedback Loop | 0/1 | Pending | — |
| 204. Results, Mistakes Review, and Learning Context Handoffs | 0/1 | Pending | — |
| 205. Localization, Accessibility, Responsive QA, and Handoff | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 200 | 5 | QBIA-02, QBIA-03, QBIA-04, QBQA-01, QBQA-02 |
| 201 | 9 | QBIA-01, QBIA-05, QBDISC-01, QBDISC-02, QBDISC-03, QBDISC-04, QBDISC-05, QBDISC-06, QBDISC-07 |
| 202 | 6 | QBSET-01, QBSET-02, QBSET-03, QBSET-04, QBSET-05, QBSET-06 |
| 203 | 10 | QBSESS-01, QBSESS-02, QBSESS-03, QBSESS-04, QBSESS-05, QBSESS-06, QBSESS-07, QBSESS-08, QBSESS-09, QBSESS-10 |
| 204 | 11 | QBRES-01, QBRES-02, QBRES-03, QBRES-04, QBRES-05, QBRES-06, QBRES-07, QBCTX-01, QBCTX-02, QBCTX-03, QBCTX-04 |
| 205 | 7 | QBCTX-05, QBQA-03, QBQA-04, QBQA-05, QBQA-06, QBQA-07, QBQA-08 |

**Total requirements:** 48
**Mapped requirements:** 48
**Unmapped requirements:** 0

## Next Up

**Phase 200: Question Bank Data Model, Routes, and UI Foundation** — Establish the typed and visual foundation for the new Question Bank module.

`$gsd-plan-phase 200`
