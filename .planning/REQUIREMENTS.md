# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.25 Phase 27: Duolingo-Style Learning Quest Integration and Practice Flow Design
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.

## v1.25 Requirements

Requirements for Phase 27. Each requirement maps to exactly one roadmap phase.

### Reference Audit and Scope

- [ ] **REF27-01**: `docs/practice/duolingo-clone-reference-audit.md` documents the `sanidhyy/duolingo-clone` source repo, what STOA learned, what STOA will adapt, what STOA will not copy, and the STOA-specific interpretation.
- [ ] **SCOPE27-01**: `docs/practice/practice-module-scope.md` defines Practice Path as a frontend/demo-backed STOA learning module, not a language-learning clone or production course system.
- [ ] **STYLE27-01**: `docs/practice/practice-ui-guidelines.md` defines restrained, premium Practice Path UI rules, including allowed light gamification and excluded cartoon/shop/leaderboard/hearts patterns.
- [ ] **COPY27-01**: Practice Path visible labels use neutral STOA terminology: Practice, Practice Path, Attempts, Progress points, Daily goal, Study streak, Show hint, Explain this step, and Ask a teacher.

### Data Contracts and Mock Support

- [ ] **TYPE27-01**: `src/types/practice.ts` defines typed Practice Path contracts for subjects, units, lessons, challenges, progress, answer results, lesson results, mistakes, overview, and parent summaries.
- [ ] **DATA27-01**: `src/data/mockPractice.ts` contains a Mathematics demo path with Linear equations and Quadratic basics units, including 3-5 challenges per lesson.
- [ ] **DATA27-02**: `src/data/mockPractice.ts` contains a Physics demo path with Motion lessons for speed/distance/time, units/conversion, and graph interpretation, including 3-5 challenges per lesson.
- [ ] **API27-01**: `docs/practice/practice-api-contract.md` documents `GET /practice/subjects`, `GET /practice/subjects/:subjectId/path`, `GET /practice/lessons/:lessonId`, `POST /practice/challenges/:challengeId/answer`, and `POST /practice/lessons/:lessonId/complete`.
- [ ] **API27-02**: `src/services/practice/practiceApi.ts` implements frontend service functions for the documented practice endpoints with mock/demo fallback support.
- [ ] **QUERY27-01**: `src/services/practice/practiceQueryKeys.ts` and `src/hooks/practice/*` expose query and mutation hooks for subjects, subject paths, lessons, answer submission, lesson completion, mistakes, overview, and summaries.
- [ ] **STATE27-01**: Lesson challenge progression uses deterministic local state or a reducer for answer selection, check, feedback, retry, hint, continue, complete, and reset transitions.
- [ ] **MOCK27-01**: Demo/mock support returns consistent practice progress across overview, subject path, lesson result, mistakes review, Student Dashboard, and Parent Report.

### Student Practice Flow

- [ ] **ROUTE27-01**: `/practice` is reachable from authenticated student navigation and renders a Practice Overview page.
- [ ] **OVERVIEW27-01**: Practice Overview displays subjects, recommended path, current progress, daily goal, study streak, and recent weak topics.
- [ ] **PATH27-01**: `/practice/:subjectId` renders subject learning units with available, locked, and completed lesson states and visible progress.
- [ ] **LESSON27-01**: `/practice/:subjectId/lessons/:lessonId` renders lesson intro, challenge prompt, attempts, progress bar, answer controls, and completion navigation.
- [ ] **CHAL27-01**: Multiple-choice challenges support selecting an option, checking the answer, showing feedback, retrying, and continuing.
- [ ] **CHAL27-02**: Text/numeric input challenges support typed answers, answer checking, feedback, retry, and explanation display.
- [ ] **CHAL27-03**: Ordering or explanation challenges are available for demo lessons and render without breaking keyboard navigation or layout.
- [ ] **FEED27-01**: Correct feedback is clear and restrained, while incorrect feedback says `Not quite`, shows a hint option, and allows retry before completion.
- [ ] **RESULT27-01**: `/practice/:subjectId/lessons/:lessonId/result` shows correct count, total count, time spent, earned progress points, mistakes review, and CTAs for continuing practice, reviewing with the Learning Assistant, and returning to dashboard.
- [ ] **MISTAKE27-01**: `/practice/mistakes` displays recent mistakes grouped by subject/topic with actions to retry practice or request an explanation.

### Learning Assistant and Teacher Support

- [ ] **HINT27-01**: Incorrect practice answers follow the hint-first sequence: feedback, hint, retry, Learning Assistant explanation, then teacher support if needed.
- [ ] **ASSIST27-01**: `Explain this step` opens or routes to a Learning Assistant explanation using practice context without saying `Ask AI` or exposing provider/model/debug terms.
- [ ] **ASSIST27-02**: Learning Assistant explanations from practice mistakes guide the next reasoning step and do not directly give the final answer first.
- [ ] **TEACH27-01**: `Ask a teacher` is available after repeated confusion, explicit `I still do not understand` intent, or weak-topic context.
- [ ] **BOUND27-01**: Practice frontend code calls STOA service/API boundaries only and does not call model providers directly.

### Dashboard and Parent Integration

- [ ] **DASH27-01**: Student Dashboard includes a Continue Practice section with recommended lesson, daily goal, study streak, recent mistakes, and a `Continue practice` CTA to `/practice`.
- [ ] **NAV27-01**: Student navigation includes Dashboard, Chat, Practice, Learning History, and Profile in the appropriate desktop/mobile surfaces.
- [ ] **PARENT27-01**: Parent report includes practice summary fields for lessons completed this week, topics practiced, mistakes reviewed, practice streak, and recommended next topic.
- [ ] **PARENT27-02**: Parent-facing practice copy avoids anxiety language and uses supportive phrasing such as `could benefit from more practice`.

### Localization, Accessibility, and Brand Fit

- [ ] **LANG27-01**: English Practice Path P0 copy exists for Practice, Continue practice, Start lesson, Try again, Check answer, Correct, Not quite, Show hint, Explain this step, Ask a teacher, Lesson complete, Review mistakes, Daily goal, and Study streak.
- [ ] **LANG27-02**: German Practice Path P0 copy uses concise labels such as `Üben`, `Weiter üben`, `Prüfen`, `Hinweis anzeigen`, and `Schritt erklären` without mobile button overflow.
- [ ] **LANG27-03**: French Practice Path P0 copy includes `Voir un indice` and `Expliquer cette étape` and fits core controls.
- [ ] **LANG27-04**: Italian Practice Path P0 copy includes `Mostra un suggerimento` and `Spiega questo passaggio` and fits core controls.
- [ ] **UI27-01**: Practice UI uses STOA premium theme styling with restrained progress, feedback, lesson-node hover, and completion states; it does not use bright cartoon, shop, gems, or loud celebration patterns.
- [ ] **A11Y27-01**: Practice challenge controls are keyboard accessible, show focus states, expose correct/incorrect state without relying only on color, and preserve readable button text across viewports.

### Documentation and Verification

- [ ] **DOC27-01**: `docs/practice/practice-demo-data.md` documents the Mathematics and Physics demo lessons, challenge types, answer expectations, hints, and explanations.
- [ ] **QA27-01**: `docs/practice/practice-functional-qa.md` covers the student practice flow, Learning Assistant integration, teacher support, parent report, i18n, accessibility, and build verification checks.
- [ ] **README27-01**: README includes Phase 27 Practice Path Integration scope, reference repo link, frontend/demo-only boundary, included surfaces, and explicit non-copy/non-backend exclusions.
- [ ] **VERIFY27-01**: Final verification runs `npm install` or records why it is skipped, `npm run build`, the practice student demo flow, the parent report demo flow, and any available lint/E2E checks.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 28 Practice Path QA, Content Refinement, and Demo Scenario Polishing

- **CONTENT28-01**: Practice lesson content is reviewed for mathematical and physics accuracy, clarity, and age-appropriate difficulty.
- **FEEDBACK28-01**: Feedback and hint copy is refined after running full student demo scenarios.
- **ASSIST28-01**: Learning Assistant behavior from practice mistakes is regression-tested across repeated confusion, direct-answer requests, and subject-scope cases.
- **PARENT28-01**: Parent report practice language is reviewed for calm, supportive phrasing and demo clarity.
- **DEMO28-01**: Practice Path demo scenarios are polished for external presentation stability.

## Out of Scope

Explicitly excluded from v1.25 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Copying the reference repo codebase | Phase 27 adapts mechanisms only; STOA keeps its architecture and product identity. |
| Next.js App Router migration | STOA already uses React + Vite and should not change framework for this module. |
| Clerk, Stripe, Neon, Drizzle, Bun, or React Admin integration | These are reference-project implementation choices and are outside STOA frontend/demo scope. |
| Formal production course database | Phase 27 uses typed contracts, mock data, and demo backend support only. |
| Complex adaptive learning algorithm | Demo recommendations can be deterministic; true adaptation is future backend/product work. |
| Shop, gems, leaderboards, mascot-driven rewards, or loud celebration effects | STOA should stay premium, calm, and education-oriented. |
| Punitive hearts/lives scarcity | Attempts should be neutral practice chances, not monetized or emotionally punitive limits. |
| Language-learning product structure | STOA Practice Path is subject-based for Mathematics, Physics, and future school topics. |
| Direct frontend calls to AI/model providers | Learning Assistant behavior remains behind STOA backend/service boundaries. |
| Production payment-gated practice access | Practice access and billing enforcement are outside this frontend/demo milestone. |
| Formal teacher marketplace or live teacher chat redesign | Phase 27 only adds practice-context escalation to existing teacher-support patterns. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REF27-01 | Phase 141 | Pending |
| SCOPE27-01 | Phase 141 | Pending |
| STYLE27-01 | Phase 141 | Pending |
| COPY27-01 | Phase 141 | Pending |
| TYPE27-01 | Phase 142 | Pending |
| DATA27-01 | Phase 142 | Pending |
| DATA27-02 | Phase 142 | Pending |
| API27-01 | Phase 142 | Pending |
| API27-02 | Phase 142 | Pending |
| QUERY27-01 | Phase 142 | Pending |
| STATE27-01 | Phase 142 | Pending |
| MOCK27-01 | Phase 142 | Pending |
| ROUTE27-01 | Phase 143 | Pending |
| OVERVIEW27-01 | Phase 143 | Pending |
| PATH27-01 | Phase 143 | Pending |
| LESSON27-01 | Phase 143 | Pending |
| CHAL27-01 | Phase 143 | Pending |
| CHAL27-02 | Phase 143 | Pending |
| CHAL27-03 | Phase 143 | Pending |
| FEED27-01 | Phase 143 | Pending |
| RESULT27-01 | Phase 143 | Pending |
| MISTAKE27-01 | Phase 143 | Pending |
| HINT27-01 | Phase 144 | Pending |
| ASSIST27-01 | Phase 144 | Pending |
| ASSIST27-02 | Phase 144 | Pending |
| TEACH27-01 | Phase 144 | Pending |
| BOUND27-01 | Phase 142 | Pending |
| DASH27-01 | Phase 145 | Pending |
| NAV27-01 | Phase 143 | Pending |
| PARENT27-01 | Phase 145 | Pending |
| PARENT27-02 | Phase 145 | Pending |
| LANG27-01 | Phase 146 | Pending |
| LANG27-02 | Phase 146 | Pending |
| LANG27-03 | Phase 146 | Pending |
| LANG27-04 | Phase 146 | Pending |
| UI27-01 | Phase 146 | Pending |
| A11Y27-01 | Phase 146 | Pending |
| DOC27-01 | Phase 146 | Pending |
| QA27-01 | Phase 146 | Pending |
| README27-01 | Phase 146 | Pending |
| VERIFY27-01 | Phase 146 | Pending |

**Coverage:**
- v1.25 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

**Phase distribution:**
- Phase 141: 4 requirements
- Phase 142: 9 requirements
- Phase 143: 11 requirements
- Phase 144: 4 requirements
- Phase 145: 3 requirements
- Phase 146: 10 requirements

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.25 roadmap creation*
