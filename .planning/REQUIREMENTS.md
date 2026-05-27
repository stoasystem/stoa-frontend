# Requirements: STOA Frontend

**Defined:** 2026-05-27
**Milestone:** v1.32 Phase 34: Practice Path General Scope Correction and Subject-Agnostic Architecture Alignment
**Core Value:** Developers can build and maintain STOA Practice Path as a general middle-school and high-school learning challenge system, while keeping the current Mathematics equations content as the first demo package rather than the final product scope.

## v1 Requirements

### Practice Path Scope Principle

- [x] **SCOPE34-01**: Documentation states that Practice Path is a general middle-school and high-school learning challenge system.
- [x] **SCOPE34-02**: Documentation states that equations are only the first demo content package.
- [x] **SCOPE34-03**: Documentation shows the canonical hierarchy: Practice Path -> Subject -> Grade level -> Topic -> Unit -> Lesson -> Challenge.
- [x] **SCOPE34-04**: Documentation shows the current demo hierarchy: Practice Path -> Mathematics -> Lower Secondary -> Equations -> Linear equations -> Solving two-step equations -> Challenges.
- [x] **SCOPE34-05**: Documentation lists future expansion examples for Mathematics, Physics, Chemistry, and Biology without presenting them as implemented content.
- [x] **SCOPE34-06**: Phase 28 docs are corrected to say "Equation Demo Content Package for the General Practice Path" rather than defining Practice Path scope.
- [x] **SCOPE34-07**: Phase 30 docs are corrected to say the final demo curriculum is equation-focused while the product architecture remains general.
- [x] **SCOPE34-08**: Phase 31 and Phase 33 docs are corrected so homepage Practice entry language does not imply Practice Path equals equations.
- [x] **SCOPE34-09**: English and Chinese versions of the Practice Path Scope Principle are recorded for future developers.

### Subject-Agnostic Practice Data Model

- [x] **MODEL34-01**: Practice domain types include subject, grade level, topic, unit, lesson, and challenge concepts.
- [x] **MODEL34-02**: Type names do not encode `EquationPath` or equivalent equation-only architecture.
- [x] **MODEL34-03**: Practice challenge data includes `subject`, `gradeLevel`, and `topic` metadata.
- [x] **MODEL34-04**: Existing equation demo data is represented as Mathematics / lower secondary / equations seed data.
- [x] **MODEL34-05**: Mock data structure supports adding future topics without changing component contracts.
- [x] **MODEL34-06**: Parent summary and tutor context data can identify the source subject and topic, not only an equation path.
- [x] **MODEL34-07**: Existing lesson, hint, answer, result, mistake, parent summary, and teacher-help flows continue to work with the generalized model.
- [x] **MODEL34-08**: API contract documentation remains subject-agnostic and topic-agnostic.
- [x] **MODEL34-09**: Internal docs explain that the current equation data is demo seed content, not a database schema commitment.

### Routes and Component Architecture

- [x] **ROUTE34-01**: Practice route strategy prefers subject/topic identifiers such as `/practice/:subjectId/:topicId` for topic-level paths.
- [x] **ROUTE34-02**: Existing `/practice` entry remains the student Practice overview route.
- [x] **ROUTE34-03**: Existing links remain backward-compatible or are redirected when route shape changes.
- [x] **ROUTE34-04**: Page and component names avoid equation-only names such as `EquationPracticePage` or `EquationPath`.
- [x] **ROUTE34-05**: Practice overview can display current available demo content as Mathematics / Equations without claiming that Practice is equation-only.
- [x] **ROUTE34-06**: Student dashboard Practice cards use subject/topic-based language.
- [x] **ROUTE34-07**: Parent and tutor Practice context surfaces use subject/topic-based labels.
- [x] **ROUTE34-08**: Route map and route documentation reflect the generalized Practice path architecture.

### UI Copy and Localization

- [x] **COPY34-01**: Homepage main Practice entry uses general wording such as Practice Path or Guided Practice.
- [x] **COPY34-02**: Homepage Practice entry says short challenges for school topics, not only short equation challenges.
- [x] **COPY34-03**: Equation language appears only in demo preview or current available content labels.
- [x] **COPY34-04**: Student dashboard copy avoids equation-only Practice product framing.
- [x] **COPY34-05**: `/practice` page copy distinguishes available demo content from product scope.
- [x] **COPY34-06**: English, German, French, and Italian locale files remain key-compatible after copy changes.
- [x] **COPY34-07**: German, French, and Italian generalized Practice copy fits mobile buttons and cards.
- [x] **COPY34-08**: User-facing copy still avoids Duolingo-style, game-first, XP, streak, heart, gem, shop, and leaderboard language.

### QA, Documentation, and Handoff

- [x] **QA34-01**: `npm run build` passes after generalized Practice Path changes.
- [x] **QA34-02**: Browser checks verify homepage Practice entry, dashboard Practice entry, `/practice`, and a lesson route still work.
- [x] **QA34-03**: Browser or static route checks verify Start Practice still routes visitors to `/login?next=/practice`.
- [x] **QA34-04**: Four-language copy checks verify the generalized Practice labels render without obvious overflow.
- [x] **QA34-05**: Documentation includes a migration note for future subject/topic expansion.
- [x] **QA34-06**: README explains the corrected Practice Path scope and the equation demo package distinction.
- [x] **QA34-07**: QA checklist confirms no remaining user-facing or developer-facing wording says Practice Path equals equations.
- [x] **QA34-08**: Phase 34 handoff records that Phase 35 or later can return to user testing after scope correction is complete.

## Future Requirements

### Curriculum Expansion

- **CURRICULUM-FUTURE-01**: Add additional Mathematics topics such as functions, geometry, fractions, probability, statistics, and trigonometry after the generalized architecture is stable.
- **CURRICULUM-FUTURE-02**: Add Physics topics such as motion, force, energy, electricity, and waves after content review.
- **CURRICULUM-FUTURE-03**: Add Chemistry and Biology topics after curriculum design, age-level review, and content QA.
- **CURRICULUM-FUTURE-04**: Add a real content management or backend curriculum service only after frontend contracts are stable.

### Product Learning

- **TEST-FUTURE-01**: Resume homepage conversion QA after Practice Path scope is corrected.
- **TEST-FUTURE-02**: Test whether students understand the Practice Path as a general learning challenge system with the first demo path focused on equations.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Adding new implemented Practice subjects | Phase 34 corrects architecture and positioning; it does not expand curriculum content. |
| Adding a full curriculum library | The milestone prepares the model and docs for expansion but keeps current content as demo seed data. |
| Production backend or database schema | Phase 34 is frontend contracts, mock data, routes, copy, docs, and QA. |
| CMS or content authoring tools | Future content management should follow after subject/topic contracts are stable. |
| Adaptive learning algorithms | Generalizing scope does not require adaptive sequencing or personalization. |
| New gamification mechanics | Practice remains calm, education-centered, and not game-first. |
| Rebuilding Learning Chat, Parent Report, or teacher support | These remain downstream surfaces; Phase 34 only ensures Practice context remains subject/topic-aware. |
| Removing the equation demo | Equations remain the current demo package and must continue to work. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCOPE34-01 | Phase 181 | Complete |
| SCOPE34-02 | Phase 181 | Complete |
| SCOPE34-03 | Phase 181 | Complete |
| SCOPE34-04 | Phase 181 | Complete |
| SCOPE34-05 | Phase 181 | Complete |
| SCOPE34-06 | Phase 181 | Complete |
| SCOPE34-07 | Phase 181 | Complete |
| SCOPE34-08 | Phase 181 | Complete |
| SCOPE34-09 | Phase 181 | Complete |
| MODEL34-01 | Phase 182 | Complete |
| MODEL34-02 | Phase 182 | Complete |
| MODEL34-03 | Phase 182 | Complete |
| MODEL34-04 | Phase 182 | Complete |
| MODEL34-05 | Phase 182 | Complete |
| MODEL34-06 | Phase 182 | Complete |
| MODEL34-07 | Phase 182 | Complete |
| MODEL34-08 | Phase 182 | Complete |
| MODEL34-09 | Phase 182 | Complete |
| ROUTE34-01 | Phase 183 | Complete |
| ROUTE34-02 | Phase 183 | Complete |
| ROUTE34-03 | Phase 183 | Complete |
| ROUTE34-04 | Phase 183 | Complete |
| ROUTE34-05 | Phase 183 | Complete |
| ROUTE34-06 | Phase 183 | Complete |
| ROUTE34-07 | Phase 183 | Complete |
| ROUTE34-08 | Phase 183 | Complete |
| COPY34-01 | Phase 184 | Complete |
| COPY34-02 | Phase 184 | Complete |
| COPY34-03 | Phase 184 | Complete |
| COPY34-04 | Phase 184 | Complete |
| COPY34-05 | Phase 184 | Complete |
| COPY34-06 | Phase 184 | Complete |
| COPY34-07 | Phase 184 | Complete |
| COPY34-08 | Phase 184 | Complete |
| QA34-01 | Phase 185 | Complete |
| QA34-02 | Phase 185 | Complete |
| QA34-03 | Phase 185 | Complete |
| QA34-04 | Phase 185 | Complete |
| QA34-05 | Phase 185 | Complete |
| QA34-06 | Phase 185 | Complete |
| QA34-07 | Phase 185 | Complete |
| QA34-08 | Phase 185 | Complete |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-05-27*
