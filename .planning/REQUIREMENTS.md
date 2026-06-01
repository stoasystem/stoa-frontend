# Requirements: STOA Frontend v2.1

**Defined:** 2026-06-01
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with controlled guided Learning Assistant behavior, natural English/German/French/Italian product copy, premium visual design, and a clean path to future real backend integration.

## v2.1 Requirements

### Question Bank Navigation and Information Architecture

- [ ] **QBIA-01**: Student can access Question Bank from authenticated student navigation near Practice and Learning Chat.
- [ ] **QBIA-02**: Question Bank routes exist for home, subject overview, topic question-set listing, set overview, session, result, mistakes review, and saved practice.
- [ ] **QBIA-03**: Question Bank page hierarchy and breadcrumbs make the path from subject to topic to set to session clear.
- [ ] **QBIA-04**: Question Bank copy clearly frames the module as a flexible exercise library, not a replacement for Practice Path.
- [ ] **QBIA-05**: Question Bank entry points do not disrupt existing Practice Path, Learning Chat, Learning History, Profile, parent, tutor, or admin routes.

### Discovery, Search, and Filters

- [ ] **QBDISC-01**: Student can use the Question Bank home page to see search, continue practice, subject cards, recommended sets, mistakes review, and recent practice.
- [ ] **QBDISC-02**: Student can search local mock question-bank data by subject, topic, skill, question set, or question prompt.
- [ ] **QBDISC-03**: Student can open a subject page and see progress, grade/level filters, difficulty filters, topic cards, and recommended sets.
- [ ] **QBDISC-04**: Student can open a topic page and see topic progress, weak areas, filters, question-set list, and a related Practice Path CTA.
- [ ] **QBDISC-05**: Topic and subject filters support grade/level, difficulty, question type, and status where relevant.
- [ ] **QBDISC-06**: Active filters remain visible and can be cleared or reset without leaving the current page.
- [ ] **QBDISC-07**: Search and filter updates are usable on mobile layouts without crowding the page.

### Question Set Overview

- [ ] **QBSET-01**: Student can open a question set overview page from a recommended set, topic list, recent practice item, saved set, or mistakes flow.
- [ ] **QBSET-02**: Question set overview displays title, description, question count, difficulty range, estimated time, subject, level, and status.
- [ ] **QBSET-03**: Question set overview displays skills covered and a question-type breakdown.
- [ ] **QBSET-04**: Question set overview displays last-attempt summary when mock attempt history exists.
- [ ] **QBSET-05**: Question set actions change by status: Start, Resume, Practice Again, or Review.
- [ ] **QBSET-06**: Question set overview explains that Learning Assistant help is available after questions without making Chat the primary activity.

### Question Session and Feedback

- [ ] **QBSESS-01**: Student can start or resume a mock question-bank session from a question set.
- [ ] **QBSESS-02**: Session page shows set title, question number, progress, prompt, answer input, check/skip actions, feedback panel, Learning Assistant CTA, and previous/next navigation.
- [ ] **QBSESS-03**: Session UI supports multiple-choice questions.
- [ ] **QBSESS-04**: Session UI supports short-answer questions.
- [ ] **QBSESS-05**: Session UI supports numeric-answer questions.
- [ ] **QBSESS-06**: Session UI supports step-by-step question layout without requiring complex formula editing or real step-level grading.
- [ ] **QBSESS-07**: Session feedback supports idle, checking, correct, incorrect, partially correct, and skipped states.
- [ ] **QBSESS-08**: Correct feedback explains the reasoning step in a concise learning tone.
- [ ] **QBSESS-09**: Incorrect feedback shows the student's answer, correct answer, explanation, Try Similar Question action, and Learning Assistant action.
- [ ] **QBSESS-10**: Student can review unanswered questions or finish anyway when ending a session with unanswered items.

### Results and Mistakes Review

- [ ] **QBRES-01**: Student can finish a question set and see a result page for the session.
- [ ] **QBRES-02**: Result page displays score, time spent, accuracy by topic, incorrect/skipped questions, and recommended next steps.
- [ ] **QBRES-03**: Result page lets the student retry mistakes.
- [ ] **QBRES-04**: Result page includes a Continue to Practice Path CTA for the related topic.
- [ ] **QBRES-05**: Student can open the mistakes review page from Question Bank home, result page, or student dashboard entry.
- [ ] **QBRES-06**: Mistakes review page displays summary, subject filter, topic filter, difficulty filter, mistake list, and Start Review Session action.
- [ ] **QBRES-07**: Mistake review session uses the same low-pressure feedback model as normal question sessions.

### Learning Assistant, Parent, and Tutor Context

- [ ] **QBCTX-01**: Learning Assistant CTA from question feedback routes to Chat with provider-agnostic question-bank context.
- [ ] **QBCTX-02**: Chat surfaces can display question-bank context without exposing mock, demo, backend, prompt, model, or provider terminology.
- [ ] **QBCTX-03**: Parent-facing learning activity can mention Question Bank attempts, mistakes reviewed, and next focus in a concise product-safe way.
- [ ] **QBCTX-04**: Tutor-facing context can identify a question-bank source when a student escalates from a question-bank item.
- [ ] **QBCTX-05**: Documentation explains the relationship between Question Bank, Practice Path, Learning Chat, Professional Teacher Support, and Parent Report.

### Demo Data, Localization, Accessibility, and Verification

- [ ] **QBQA-01**: Question Bank uses typed deterministic mock data for subjects, topics, question sets, questions, sessions, results, saved sets, and mistakes.
- [ ] **QBQA-02**: Question Bank service and hook boundaries are replaceable by future backend APIs without changing page components substantially.
- [ ] **QBQA-03**: User-facing Question Bank copy exists for English, German, French, and Italian.
- [ ] **QBQA-04**: Question Bank interactive controls are keyboard-accessible and have clear labels, focus states, and result/feedback announcements where needed.
- [ ] **QBQA-05**: Question Bank responsive layout is verified for mobile and desktop.
- [ ] **QBQA-06**: User-facing Question Bank UI is checked for visible demo/mock/backend/provider/internal terminology.
- [ ] **QBQA-07**: `npm run lint` and `npm run build` pass after the milestone implementation.
- [ ] **QBQA-08**: Browser smoke checks cover the home, subject, topic, set overview, session, result, mistakes review, and Chat handoff paths.

## Future Requirements

### Production Question Bank

- **FUTQB-01**: Production backend stores question-bank subjects, topics, question sets, questions, attempts, results, saved sets, and mistakes.
- **FUTQB-02**: Admin or curriculum staff can manage question-bank content through a production-safe authoring workflow.
- **FUTQB-03**: Question Bank supports production permissions and school/organization assignment rules.
- **FUTQB-04**: Question Bank activity persists across devices and sessions.
- **FUTQB-05**: Question Bank analytics can power deeper parent, tutor, and organization insights.

### Advanced Practice

- **FUTQB-06**: AI-assisted or teacher-authored question generation can be introduced through backend-owned content review.
- **FUTQB-07**: Exam-prep mode can support timed sets, official exam categories, and more formal result reporting.
- **FUTQB-08**: Image-based or worksheet-derived question entry can support uploaded questions after privacy and backend scope are defined.
- **FUTQB-09**: Formal curriculum-standard mapping can connect question sets to school standards and learning objectives.
- **FUTQB-10**: Paid or assigned question-bank unlocking can be introduced after product packaging and backend authorization are defined.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Production question-bank backend | v2.1 validates UI, IA, and mock interaction flow before backend architecture. |
| Question authoring/admin UI | Content management is separate from student-facing question-bank discovery and practice. |
| AI-generated questions | Generated content needs backend-owned review, safety, curriculum, and quality workflow. |
| Image recognition or uploaded-question parsing | Upload/image intelligence is outside the UI design milestone. |
| Video help or live teacher joining | v2.1 uses Learning Assistant handoff and existing professional teacher support boundaries only. |
| Complex timed exam mode | The milestone should feel like low-pressure learning practice, not a formal exam platform. |
| Production permissions or paid unlocking | Authorization and product packaging require backend/payment scope. |
| Deep school curriculum-standard mapping | Useful later, but v2.1 only needs lightweight skills/topics metadata. |
| Complex formula editor | Plain inputs and simple rendered math text are enough for the demo question types. |
| New supported UI languages | v2.1 uses the existing English, German, French, and Italian localization surface. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QBIA-01 | — | Pending |
| QBIA-02 | — | Pending |
| QBIA-03 | — | Pending |
| QBIA-04 | — | Pending |
| QBIA-05 | — | Pending |
| QBDISC-01 | — | Pending |
| QBDISC-02 | — | Pending |
| QBDISC-03 | — | Pending |
| QBDISC-04 | — | Pending |
| QBDISC-05 | — | Pending |
| QBDISC-06 | — | Pending |
| QBDISC-07 | — | Pending |
| QBSET-01 | — | Pending |
| QBSET-02 | — | Pending |
| QBSET-03 | — | Pending |
| QBSET-04 | — | Pending |
| QBSET-05 | — | Pending |
| QBSET-06 | — | Pending |
| QBSESS-01 | — | Pending |
| QBSESS-02 | — | Pending |
| QBSESS-03 | — | Pending |
| QBSESS-04 | — | Pending |
| QBSESS-05 | — | Pending |
| QBSESS-06 | — | Pending |
| QBSESS-07 | — | Pending |
| QBSESS-08 | — | Pending |
| QBSESS-09 | — | Pending |
| QBSESS-10 | — | Pending |
| QBRES-01 | — | Pending |
| QBRES-02 | — | Pending |
| QBRES-03 | — | Pending |
| QBRES-04 | — | Pending |
| QBRES-05 | — | Pending |
| QBRES-06 | — | Pending |
| QBRES-07 | — | Pending |
| QBCTX-01 | — | Pending |
| QBCTX-02 | — | Pending |
| QBCTX-03 | — | Pending |
| QBCTX-04 | — | Pending |
| QBCTX-05 | — | Pending |
| QBQA-01 | — | Pending |
| QBQA-02 | — | Pending |
| QBQA-03 | — | Pending |
| QBQA-04 | — | Pending |
| QBQA-05 | — | Pending |
| QBQA-06 | — | Pending |
| QBQA-07 | — | Pending |
| QBQA-08 | — | Pending |

**Coverage:**
- v2.1 requirements: 48 total
- Mapped to phases: 0
- Unmapped: 48

---
*Requirements defined: 2026-06-01*
*Last updated: 2026-06-01 after v2.1 research*
