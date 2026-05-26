# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.26 Phase 28: Practice Path QA, Equation Lesson Design, and Demo Scenario Polishing
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, stable demo backend support, documented API contracts, controlled guided Learning Assistant behavior, four-language product copy, premium visual design, and a clean path to future real backend integration.

## v1.26 Requirements

Requirements for Phase 28. Each requirement maps to exactly one roadmap phase.

### Equation Demo Scope

- [x] **SCOPE28-01**: Practice demo content is limited to Mathematics equations and does not present Physics or unrelated math paths as part of the Phase 28 demo.
- [x] **SCOPE28-02**: `docs/practice/equation-practice-path.md` documents the equation-only demo path, target learner level, unit progression, and out-of-scope curriculum areas.
- [x] **SCOPE28-03**: The equation path is positioned as frontend/demo content polish, not a full curriculum system, real database, adaptive learning algorithm, or production backend.
- [x] **SCOPE28-04**: Practice overview and subject path copy make the demo focus on equations clear within the first screen.

### Equation Lesson Content

- [x] **LINEAR28-01**: `docs/practice/linear-equation-lessons.md` defines Unit 1 lessons for one-step equations, two-step equations, brackets, and word problems.
- [x] **LINEAR28-02**: Unit 1 demo challenges teach equal operations, isolating `x`, operation order, brackets, and answer checking at lower-secondary difficulty.
- [x] **QUAD28-01**: `docs/practice/quadratic-equation-lessons.md` defines Unit 2 lessons for recognizing quadratics, factoring simple quadratics, solving factored quadratics, and checking two solutions.
- [x] **QUAD28-02**: Unit 2 demo challenges avoid quadratic formula derivation, discriminants, complex roots, vertex formulas, and calculus.
- [x] **SYSTEM28-01**: `docs/practice/linear-system-lessons.md` defines Unit 3 lessons for systems meaning, substitution, elimination, and checking a solution.
- [x] **SYSTEM28-02**: Unit 3 demo challenges teach that a solution must satisfy both equations and use simple substitution or elimination.
- [x] **DATA28-01**: `src/data/mockPractice.ts` exposes a Mathematics equation path with units `unit-linear-equations`, `unit-quadratic-equations`, and `unit-linear-systems`.
- [x] **DATA28-02**: Each demo lesson has 3-5 challenges with unambiguous correct answers and no challenge requiring high-school advanced math.

### Challenge Difficulty And Copy

- [x] **DIFF28-01**: `docs/practice/challenge-difficulty-rules.md` defines the recognition, simple calculation, step selection, full solution, and optional review/word-problem difficulty ladder.
- [x] **DIFF28-02**: Demo challenge order follows a clear easy-to-harder progression inside each lesson.
- [x] **FEED28-01**: `docs/practice/feedback-hint-copy-rules.md` defines correct feedback, incorrect feedback, hint, and explanation copy rules.
- [x] **FEED28-02**: Correct feedback names the specific useful step, not only `Correct`.
- [x] **FEED28-03**: Incorrect feedback stays supportive, points to the next reasoning step, and avoids giving the complete answer.
- [x] **HINT28-01**: Every hint in `src/data/mockPractice.ts` is short, directional, lower-secondary appropriate, and does not reveal the final answer.
- [x] **MISTAKE28-01**: Mistake review cards and copy explain what to revisit by topic and next step, not by failure language.
- [x] **RESULT28-01**: Lesson result copy reinforces what the student practiced, what improved, and what to try next without loud celebration or punitive language.

### Learning Assistant And Teacher Escalation

- [x] **ASSIST28-01**: Practice `Explain this step` guidance is tied to the current challenge topic and answer state.
- [x] **ASSIST28-02**: Practice explanation copy guides the next step and avoids directly giving the final answer first.
- [x] **ASSIST28-03**: Repeated incorrect attempts can surface a more specific hint before full explanation or teacher support.
- [x] **TEACH28-01**: `Ask a teacher` remains an escalation after repeated confusion, explicit stuck intent, or weak-topic context, not a first incorrect-answer action.
- [x] **BOUND28-01**: Practice frontend code continues to call only STOA service/API boundaries and does not call model providers directly.

### Parent Report And Demo Scenario

- [x] **PARENT28-01**: `docs/practice/practice-parent-report-copy.md` defines parent wording for practice activity, current path, lessons completed, topics practiced, mistakes reviewed, and suggested next topic.
- [x] **PARENT28-02**: Parent Report practice summary says the student is practicing equations and could benefit from more work on specific topics without using anxiety language.
- [x] **PARENT28-03**: Parent Report summary data aligns with the equation-only demo path.
- [x] **DEMO28-01**: `docs/practice/practice-demo-scenario.md` documents a 3-5 minute demo from Student Dashboard to Practice, hint, explanation, lesson completion, and Parent Report.
- [x] **DEMO28-02**: The recommended demo flow includes one correct answer, one incorrect answer, hint display, retry or explanation, result page, and parent summary.

### Localization, QA, And Verification

- [x] **LANG28-01**: English, German, French, and Italian Practice labels cover Practice, Continue practice, Check answer, Not quite, Try again, Show hint, Explain this step, Lesson complete, and Review mistakes.
- [x] **LANG28-02**: German, French, and Italian labels remain short enough for core Practice controls on mobile.
- [x] **QA28-01**: `docs/practice/practice-content-qa.md` verifies equation path scope, lesson goals, challenge clarity, answer correctness, hint quality, feedback quality, Learning Assistant behavior, and parent copy.
- [x] **QA28-02**: Practice functional QA includes one-variable linear equation completion, quadratic equation completion, linear-system completion, hint-first behavior, teacher support availability, parent report summary, and demo scenario smoke.
- [x] **README28-01**: README includes Phase 28 Practice Path QA and Equation Demo Content scope, included equation topics, exclusions, and main tasks.
- [x] **VERIFY28-01**: Final verification runs `npm install` or records why it is skipped, `npm run build`, the equation Practice student demo flow, the parent report demo flow, and available smoke checks.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 29 Practice Path Demo Rehearsal, Parent Value Framing, and Learning Report Integration

- **DEMO29-01**: Practice Path external demo rehearsal is tested against parent, teacher, and investor presentation needs.
- **PARENT29-01**: Parent value framing is refined across landing, dashboard, parent report, and demo scripts.
- **REPORT29-01**: Learning reports integrate Practice data more naturally with chat history and teacher-support signals.
- **SCRIPT29-01**: Demo presentation scripts are updated for external audience delivery.
- **FEEDBACK29-01**: Real user feedback capture is prepared for Practice Path demo review.

## Out of Scope

Explicitly excluded from v1.26 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full math curriculum | Phase 28 is an equation demo polish milestone, not a curriculum build. |
| New Physics practice content | Phase 28 should narrow the demo, not expand subjects. |
| Geometry, probability, functions, statistics, or advanced algebra paths | These would dilute the 3-5 minute equation demo. |
| Large question bank | Demo stability needs a small controlled set of challenges. |
| Complex adaptive learning | Deterministic progression is enough for frontend demo testing. |
| Real course database or backend schema | Future backend-owned work; Phase 28 uses mock/demo data. |
| Long-term learning records | Parent summary can use demo data only. |
| Quadratic formula derivation, discriminants, complex roots, vertex formulas, derivatives | Too advanced or too broad for this lower-secondary demo. |
| Direct frontend model-provider calls | Practice and Learning Assistant behavior must stay behind STOA service/API boundaries. |
| New major UI surfaces | This milestone refines existing Practice/Dashboard/Parent surfaces. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCOPE28-01 | Phase 147 | Complete |
| SCOPE28-02 | Phase 147 | Complete |
| SCOPE28-03 | Phase 147 | Complete |
| SCOPE28-04 | Phase 147 | Complete |
| LINEAR28-01 | Phase 148 | Complete |
| LINEAR28-02 | Phase 148 | Complete |
| QUAD28-01 | Phase 148 | Complete |
| QUAD28-02 | Phase 148 | Complete |
| SYSTEM28-01 | Phase 148 | Complete |
| SYSTEM28-02 | Phase 148 | Complete |
| DATA28-01 | Phase 148 | Complete |
| DATA28-02 | Phase 148 | Complete |
| DIFF28-01 | Phase 149 | Complete |
| DIFF28-02 | Phase 149 | Complete |
| FEED28-01 | Phase 149 | Complete |
| FEED28-02 | Phase 149 | Complete |
| FEED28-03 | Phase 149 | Complete |
| HINT28-01 | Phase 149 | Complete |
| MISTAKE28-01 | Phase 149 | Complete |
| RESULT28-01 | Phase 149 | Complete |
| ASSIST28-01 | Phase 150 | Complete |
| ASSIST28-02 | Phase 150 | Complete |
| ASSIST28-03 | Phase 150 | Complete |
| TEACH28-01 | Phase 150 | Complete |
| BOUND28-01 | Phase 150 | Complete |
| PARENT28-01 | Phase 151 | Complete |
| PARENT28-02 | Phase 151 | Complete |
| PARENT28-03 | Phase 151 | Complete |
| DEMO28-01 | Phase 151 | Complete |
| DEMO28-02 | Phase 151 | Complete |
| LANG28-01 | Phase 152 | Complete |
| LANG28-02 | Phase 152 | Complete |
| QA28-01 | Phase 152 | Complete |
| QA28-02 | Phase 152 | Complete |
| README28-01 | Phase 152 | Complete |
| VERIFY28-01 | Phase 152 | Complete |

**Coverage:**
- v1.26 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

**Phase distribution:**
- Phase 147: 4 requirements
- Phase 148: 8 requirements
- Phase 149: 8 requirements
- Phase 150: 5 requirements
- Phase 151: 5 requirements
- Phase 152: 6 requirements

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.26 implementation and verification*
