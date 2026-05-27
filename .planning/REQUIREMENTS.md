# Requirements: STOA Frontend

**Defined:** 2026-05-27
**Milestone:** v1.33 Phase 35: Practice Roadmap UI, Lesson Progression, and Challenge Journey Experience
**Core Value:** Developers can build and verify a subject-agnostic Practice roadmap experience where students see current position, completed lessons, next steps, locked content, and Learning Chat as the explanation path.

## v1 Requirements

### Roadmap Experience

- [ ] **ROAD35-01**: Student can open `/practice` and see a roadmap-style Practice path instead of only a normal list or card grid.
- [ ] **ROAD35-02**: Student can open a topic roadmap at `/practice/:subjectId/:topicId`, including the current demo route for Mathematics / Equations.
- [ ] **ROAD35-03**: Student can see subject, grade level, topic, unit, lesson, and challenge progression in the Practice roadmap.
- [ ] **ROAD35-04**: Student can see a progress percentage for the current roadmap topic.
- [ ] **ROAD35-05**: Student can see the currently recommended next lesson.
- [ ] **ROAD35-06**: Student can use a continue-next-lesson CTA that opens the current lesson.
- [ ] **ROAD35-07**: Practice roadmap copy explains that Learning Chat can explain unclear lesson steps.
- [ ] **ROAD35-08**: The roadmap experience feels like progression while preserving STOA's premium education tone.

### Lesson Node States and Interactions

- [ ] **NODE35-01**: Student can distinguish completed lesson nodes from current, available, locked, and review lesson nodes.
- [ ] **NODE35-02**: Student can click a completed lesson node and reach a review path or review action.
- [ ] **NODE35-03**: Student can click the current lesson node and start or continue that lesson.
- [ ] **NODE35-04**: Student can click an available lesson node and start that lesson.
- [ ] **NODE35-05**: Student cannot directly start a locked lesson node.
- [ ] **NODE35-06**: Student can click or focus a locked lesson node and see its unlock condition.
- [ ] **NODE35-07**: Student can see completed nodes with a clear completion mark.
- [ ] **NODE35-08**: Student can see the current node visually highlighted without disrupting layout.
- [ ] **NODE35-09**: Lesson completion can update roadmap state in the mock/demo flow at least enough to show progression.

### Roadmap Data and API Contract

- [ ] **DATA35-01**: Practice roadmap types define `RoadmapLessonStatus` with completed, current, available, locked, and review states.
- [ ] **DATA35-02**: Practice topic data supports subject id, grade level, title, description, progress, and current lesson id.
- [ ] **DATA35-03**: Practice roadmap data supports subject id, topic id, grade level, progress, current lesson id, units, and lessons.
- [ ] **DATA35-04**: Practice roadmap unit data supports id, title, description, order, and lesson collection.
- [ ] **DATA35-05**: Practice roadmap lesson data supports id, title, description, order, status, estimated minutes, and optional unlock condition.
- [ ] **DATA35-06**: Demo roadmap data uses Mathematics / lower secondary / Equations without hard-coding equations as the only supported Practice topic.
- [ ] **DATA35-07**: Practice API/service contracts document a future `GET /practice/:subjectId/:topicId/roadmap` shape.
- [ ] **DATA35-08**: Practice roadmap query or hook code can load the demo roadmap through the existing frontend data layer pattern.

### Components and Layout

- [ ] **COMP35-01**: `PracticeRoadmap` renders a complete topic roadmap from units and lessons.
- [ ] **COMP35-02**: `RoadmapUnitSection` renders each unit title, description, and lesson path.
- [ ] **COMP35-03**: `RoadmapLessonNode` renders lesson status, order, title, estimated time, and action affordance.
- [ ] **COMP35-04**: `RoadmapConnector` renders stable path connectors between lesson nodes.
- [ ] **COMP35-05**: `RoadmapProgressHeader` renders topic title, progress summary, and current path context.
- [ ] **COMP35-06**: `RoadmapUnlockHint` renders the locked lesson unlock explanation.
- [ ] **COMP35-07**: `ContinueNextLessonCard` renders the next lesson and continue action.
- [ ] **COMP35-08**: Desktop roadmap layout has a clear path feeling with stable connectors and restrained left/right node offset.
- [ ] **COMP35-09**: Mobile roadmap layout remains readable with a simpler vertical path.
- [ ] **COMP35-10**: Long German lesson titles, French apostrophes, and Italian CTA labels do not overflow their containers.

### Documentation, Localization, and Verification

- [ ] **DOC35-01**: Documentation describes Practice roadmap UI principles and STOA visual direction.
- [ ] **DOC35-02**: Documentation describes lesson node status rules and click behavior.
- [ ] **DOC35-03**: Documentation describes mobile roadmap layout rules.
- [ ] **DOC35-04**: Documentation describes the demo roadmap data and subject-agnostic expansion model.
- [ ] **DOC35-05**: Documentation includes a roadmap QA checklist covering flow, interaction, visual, localization, and build checks.
- [ ] **LOC35-01**: English, German, French, and Italian copy exists for roadmap title, current lesson, locked hint, and continue action.
- [ ] **LOC35-02**: Locale copy supports the Practice roadmap without using game-first, mascot, XP, streak, hearts, gems, shop, or leaderboard language.
- [ ] **QA35-01**: `npm run build` succeeds after the Practice roadmap implementation.
- [ ] **QA35-02**: Browser or equivalent UI checks verify `/practice` roadmap, topic roadmap, lesson node clicks, locked hint, continue CTA, desktop layout, and mobile layout.
- [ ] **QA35-03**: README explains that Practice now includes a roadmap-style learning path and that the current demo uses Mathematics / Equations.

## Future Requirements

### Curriculum Expansion

- **CURRICULUM-FUTURE-01**: Add Mathematics topics such as functions, geometry, fractions, probability, statistics, and trigonometry after the roadmap architecture is stable.
- **CURRICULUM-FUTURE-02**: Add Physics, Chemistry, and Biology roadmap topics after curriculum design and content QA.
- **CURRICULUM-FUTURE-03**: Add a real curriculum backend or content management service after frontend contracts and demo-roadmap behavior are validated.

### Adaptive Learning and Feedback

- **ADAPT-FUTURE-01**: Add adaptive lesson recommendation after enough real learner progress data exists.
- **FEEDBACK-FUTURE-01**: Refine post-completion progress feedback and parent visibility in a follow-up milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Adding new implemented subjects | Phase 35 improves the roadmap experience only; equations remain the current demo content package. |
| Adding a large new lesson bank | The milestone needs enough demo data to prove the roadmap pattern, not broad curriculum coverage. |
| Production backend or database work | Roadmap data remains mock/demo and frontend-contract based for this milestone. |
| Adaptive learning algorithms | The roadmap can show a current lesson without complex personalization. |
| Formal curriculum CMS | Content authoring belongs after the roadmap data contract is stable. |
| Complex game economy | STOA needs progression, not shops, gems, hearts, leaderboards, streak pressure, or mascot-driven rewards. |
| Full redesign of Learning Chat, Parent Report, or teacher support | Phase 35 only reinforces their relationship to Practice through copy and navigation. |
| New payment or feature-gating logic | Locked roadmap lessons are learning progression locks, not subscription locks. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROAD35-01 | Phase 188 | Complete |
| ROAD35-02 | Phase 188 | Complete |
| ROAD35-03 | Phase 188 | Complete |
| ROAD35-04 | Phase 188 | Complete |
| ROAD35-05 | Phase 188 | Complete |
| ROAD35-06 | Phase 188 | Complete |
| ROAD35-07 | Phase 188 | Complete |
| ROAD35-08 | Phase 189 | Complete |
| NODE35-01 | Phase 187 | Complete |
| NODE35-02 | Phase 188 | Complete |
| NODE35-03 | Phase 188 | Complete |
| NODE35-04 | Phase 188 | Complete |
| NODE35-05 | Phase 187 | Complete |
| NODE35-06 | Phase 187 | Complete |
| NODE35-07 | Phase 187 | Complete |
| NODE35-08 | Phase 187 | Complete |
| NODE35-09 | Phase 188 | Complete |
| DATA35-01 | Phase 186 | Complete |
| DATA35-02 | Phase 186 | Complete |
| DATA35-03 | Phase 186 | Complete |
| DATA35-04 | Phase 186 | Complete |
| DATA35-05 | Phase 186 | Complete |
| DATA35-06 | Phase 186 | Complete |
| DATA35-07 | Phase 186 | Complete |
| DATA35-08 | Phase 186 | Complete |
| COMP35-01 | Phase 187 | Complete |
| COMP35-02 | Phase 187 | Complete |
| COMP35-03 | Phase 187 | Complete |
| COMP35-04 | Phase 187 | Complete |
| COMP35-05 | Phase 187 | Complete |
| COMP35-06 | Phase 187 | Complete |
| COMP35-07 | Phase 187 | Complete |
| COMP35-08 | Phase 189 | Complete |
| COMP35-09 | Phase 189 | Complete |
| COMP35-10 | Phase 189 | Complete |
| DOC35-01 | Phase 189 | Complete |
| DOC35-02 | Phase 189 | Complete |
| DOC35-03 | Phase 189 | Complete |
| DOC35-04 | Phase 186 | Complete |
| DOC35-05 | Phase 189 | Complete |
| LOC35-01 | Phase 189 | Complete |
| LOC35-02 | Phase 189 | Complete |
| QA35-01 | Phase 190 | Complete |
| QA35-02 | Phase 190 | Complete |
| QA35-03 | Phase 190 | Complete |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-05-27*
*Last updated: 2026-05-27 after v1.33 roadmap creation*
