# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.35 Phase 37: Student Language Preference and Learning Assistant Response Localization** - Phases 195-199 (shipped 2026-06-01)
- ✅ **v2.1 Question Bank UI Design** - Phases 200-205 (shipped 2026-06-02)
- ✅ **v2.2 Photo & File Upload UI Foundation** - Phases 206-211 (shipped 2026-06-02)
- ✅ **v2.3 Live Classroom & Video Help UI Foundation** - Phases 212-218 (shipped 2026-06-02)
- ◆ **v2.4 UI Copy & Web Design Refinement** - Phases 219-224 (planning)

## Phases

- [ ] **Phase 219: Student Dashboard Learning Hierarchy and CTA Taxonomy** - Reorganize the student dashboard and navigation labels so the learning journey has a clear priority order and consistent action language.
- [ ] **Phase 220: Practice Library Naming, Structure, Session, Result, and Mistakes Refinement** - Polish Question Bank student-facing copy into Practice Library and refine practice set, session, result, and mistakes review experiences.
- [ ] **Phase 221: Upload a Question and Chat Tutor Support Copy Refinement** - Polish upload trust wording, attachment states, Chat teacher-support states, and Start Live Classroom escalation copy.
- [ ] **Phase 222: Online Classroom Learning Context and Summary Refinement** - Refine classroom home, schedule, lobby, room, controls, materials, and summary surfaces around learning context and next steps.
- [ ] **Phase 223: Tutor Context and Parent Learning Support Refinement** - Strengthen tutor queue/lobby/room context and parent dashboard learning-support visibility without adding new management capabilities.
- [ ] **Phase 224: Shared States, I18n, Accessibility, E2E, and Handoff Closure** - Consolidate shared empty/error/context/next-step patterns, i18n, high-risk copy audit, accessibility checks, E2E coverage, docs, and final verification.

## Phase Details

### Phase 219: Student Dashboard Learning Hierarchy and CTA Taxonomy

**Goal**: Students can open Dashboard and immediately understand the next learning action, practice options, help options, live support, and recent activity without seeing an undifferentiated feature grid.
**Depends on**: Phase 218
**Requirements**: LEH-01, LEH-02, LEH-03, LEH-04, LEH-05, LEH-06, LEH-07, LEH-08
**Success Criteria**:
  1. Student Dashboard is organized into Continue Learning, Today's Practice, Need Help, Live Support, and Recent Activity sections.
  2. Dashboard has one visually dominant primary learning action and secondary cards do not compete equally.
  3. Student-facing navigation and dashboard labels use Practice Library instead of Question Bank.
  4. Mobile Dashboard order prioritizes Continue Learning and Need Help before secondary practice/live-support sections.
  5. CTA naming follows the v2.4 approved vocabulary for core learning actions.
**Plans**: 219-PLAN.md
**UI hint**: yes

### Phase 220: Practice Library Naming, Structure, Session, Result, and Mistakes Refinement

**Goal**: Practice Library reads as a calm open practice resource, while question sets, sessions, results, and mistakes review guide students without punitive or exam-heavy language.
**Depends on**: Phase 219
**Requirements**: PLR-01, PLR-02, PLR-03, PLR-04, PLR-05, PLR-06, PLR-07, PLR-08, PLR-09, PLR-10, PLR-11
**Success Criteria**:
  1. `/question-bank` student-facing title and key labels read as Practice Library with clear subtitle.
  2. Practice Library home prioritizes Continue Practice, Find Exercises, Recommended, Review & Improve, and All Subjects.
  3. Question set cards show concise learning metadata and state-aware Start/Resume/Practice Again/Review Mistakes actions.
  4. Question session feedback and result copy avoids punitive terms and guides students toward next steps.
  5. Mistakes review empty and populated states are supportive and include clear actions.
**Plans**: 220-PLAN.md
**UI hint**: yes

### Phase 221: Upload a Question and Chat Tutor Support Copy Refinement

**Goal**: Upload and Chat support copy is trustworthy: students know uploads provide learning context, tutor support is the next escalation, and live classroom starts only when deeper synchronous help is useful.
**Depends on**: Phase 220
**Requirements**: UCT-01, UCT-02, UCT-03, UCT-04, UCT-05, UCT-06, UCT-07, UCT-08, UCT-09, UCT-10
**Success Criteria**:
  1. Upload UI consistently uses Upload a Question, Take Photo, Attach File/PDF, and Ask Learning Assistant.
  2. Upload modal and inline upload states show supported formats, size, privacy note, attached files, and recoverable errors.
  3. Chat attachment display avoids image-reading or solved-problem claims.
  4. Teacher support states read as Tutor support requested, Tutor joined, Learning Assistant observing, and Start Live Classroom.
  5. High-risk upload/chat terms such as Photo Solver, instant solve, AI teacher, and human fallback are absent from user-facing UI.
**Plans**: 221-PLAN.md
**UI hint**: yes

### Phase 222: Online Classroom Learning Context and Summary Refinement

**Goal**: Online Classroom feels like learning support with context, materials, and next steps, not a generic meeting shell.
**Depends on**: Phase 221
**Requirements**: OCR-01, OCR-02, OCR-03, OCR-04, OCR-05, OCR-06, OCR-07, OCR-08, OCR-09, OCR-10, OCR-11, OCR-12
**Success Criteria**:
  1. Classroom home explains the AI-first, tutor-text-second, live-classroom-third support ladder.
  2. Schedule and lobby pages foreground subject, topic, tutor, language, source, materials, and before-join state.
  3. Room defaults to learning context with Shared Problem, Materials, Notes, Participants, and honest video placeholders.
  4. Control labels use the approved classroom vocabulary and avoid technical/provider-specific terms.
  5. Classroom summary focuses on What we reviewed, Materials, Recommended next steps, and Back to Dashboard.
**Plans**: 222-PLAN.md
**UI hint**: yes

### Phase 223: Tutor Context and Parent Learning Support Refinement

**Goal**: Tutors see enough student context before acting, and parents understand STOA's learning support system without receiving student-only controls.
**Depends on**: Phase 222
**Requirements**: TPC-01, TPC-02, TPC-03, TPC-04, TPC-05, TPC-06, TPC-07, TPC-08
**Success Criteria**:
  1. Tutor queue cards expose student need, source, waiting/status, context, materials, and clear actions.
  2. Tutor lobby exposes student, level, language, topic, why help is needed, attached materials, and suggested focus.
  3. Tutor room defaults toward notes-oriented work and keeps Save Notes / End Session semantics clear.
  4. Parent Dashboard includes lightweight Learning Support visibility across practice, upload, tutor support, and classroom.
  5. Parent copy avoids observer, recording, attendance, and classroom-control claims.
**Plans**: 223-PLAN.md
**UI hint**: yes

### Phase 224: Shared States, I18n, Accessibility, E2E, and Handoff Closure

**Goal**: The v2.4 refinement is consistent, localized, accessible, documented, and verified through targeted E2E plus lint/build.
**Depends on**: Phase 223
**Requirements**: SQA-01, SQA-02, SQA-03, SQA-04, SQA-05, SQA-06, SQA-07, SQA-08, SQA-09, SQA-10, SQA-11, SQA-12, SQA-13, SQA-14, SQA-15
**Success Criteria**:
  1. Shared empty/error/context/next-step/status patterns are reused or extended without duplicating local card styles unnecessarily.
  2. Refined copy is represented in i18n keys across affected namespaces where practical, with DE/FR/IT initial copy and native-review notes where needed.
  3. High-risk user-facing terms are audited and removed or justified.
  4. Touched pages keep unique h1s, accessible controls, recoverable errors, and non-color-only states.
  5. Playwright verifies Student Dashboard clarity, Practice Library naming, Upload trust wording, Chat-to-classroom wording, Classroom layout, and key empty/error states.
  6. `npm run lint` and `npm run build` pass.
**Plans**: 224-PLAN.md
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 219. Student Dashboard Learning Hierarchy and CTA Taxonomy | 0/1 | Pending | — |
| 220. Practice Library Naming, Structure, Session, Result, and Mistakes Refinement | 0/1 | Pending | — |
| 221. Upload a Question and Chat Tutor Support Copy Refinement | 0/1 | Pending | — |
| 222. Online Classroom Learning Context and Summary Refinement | 0/1 | Pending | — |
| 223. Tutor Context and Parent Learning Support Refinement | 0/1 | Pending | — |
| 224. Shared States, I18n, Accessibility, E2E, and Handoff Closure | 0/1 | Pending | — |

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 219 | 8 | LEH-01, LEH-02, LEH-03, LEH-04, LEH-05, LEH-06, LEH-07, LEH-08 |
| 220 | 11 | PLR-01, PLR-02, PLR-03, PLR-04, PLR-05, PLR-06, PLR-07, PLR-08, PLR-09, PLR-10, PLR-11 |
| 221 | 10 | UCT-01, UCT-02, UCT-03, UCT-04, UCT-05, UCT-06, UCT-07, UCT-08, UCT-09, UCT-10 |
| 222 | 12 | OCR-01, OCR-02, OCR-03, OCR-04, OCR-05, OCR-06, OCR-07, OCR-08, OCR-09, OCR-10, OCR-11, OCR-12 |
| 223 | 8 | TPC-01, TPC-02, TPC-03, TPC-04, TPC-05, TPC-06, TPC-07, TPC-08 |
| 224 | 15 | SQA-01, SQA-02, SQA-03, SQA-04, SQA-05, SQA-06, SQA-07, SQA-08, SQA-09, SQA-10, SQA-11, SQA-12, SQA-13, SQA-14, SQA-15 |

**Total requirements:** 64
**Mapped requirements:** 64
**Unmapped requirements:** 0

## Next Up

**Phase 219: Student Dashboard Learning Hierarchy and CTA Taxonomy** — Reorganize the student dashboard and navigation labels so the learning journey has a clear priority order and consistent action language.
