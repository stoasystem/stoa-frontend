# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.24 Phase 26: Learning Assistant Functional QA, Multi-Turn Behavior Testing, and Bug Fixing
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with controlled guided Learning Assistant behavior, stable demo backend support, documented API contracts, coherent demo flows, and a clean path to future real backend integration.

## v1.24 Requirements

Requirements for Phase 26. Each requirement maps to exactly one roadmap phase.

### QA Planning and Behavior Rules

- [x] **QA26-01**: `docs/qa/learning-assistant-functional-qa-plan.md` defines the Learning Assistant functional QA dimensions, test method, P0 failure categories, and verification commands.
- [x] **RULE26-01**: `docs/learning-assistant/relevance-rules.md` defines what relevant answers must include for core demo questions and what counts as irrelevant or hallucinated output.
- [x] **RULE26-02**: `docs/learning-assistant/multi-turn-behavior-rules.md` defines context consistency expectations for follow-up questions, repeated confusion, unrelated turns, and simulated unclear uploads.
- [x] **RULE26-03**: `docs/learning-assistant/repair-prompt-rules.md` defines allowed repair triggers, repair-prompt constraints, and forbidden hard-coded answer fixes.
- [x] **RULE26-04**: `docs/learning-assistant/demo-readiness-threshold.md` defines P0 behavior failure thresholds, internal-term leakage thresholds, grade/subject scope thresholds, and acceptable known-issue handling.
- [x] **BUG26-01**: `docs/qa/learning-assistant-bug-reproduction-log.md` provides a reproducible bug log template with bug ID, date, test case, profile, turns, actual/expected response, failure type, provider, fix attempt, status, and regression-test flag.

### Regression Data and Test Suite

- [x] **DATA26-01**: `demo-harness/data/multi_turn_test_cases.json` contains at least the eight required multi-turn scenarios: linear equation follow-up, quadratic factoring follow-up, physics speed formula follow-up, repeated confusion, unrelated question after math, direct-answer-only request, unclear upload simulation, and above-grade question.
- [x] **TEST26-01**: `demo-harness/tests/test_relevance.py` verifies core Learning Assistant answers stay relevant to the student question.
- [x] **TEST26-02**: `demo-harness/tests/test_grade_scope.py` verifies lower-secondary demo questions do not use advanced concepts such as derivatives, integrals, complex roots, linear algebra, or university notation.
- [x] **TEST26-03**: `demo-harness/tests/test_subject_scope.py` verifies out-of-subject questions are gently redirected to saved learning scope or professional teacher support.
- [x] **TEST26-04**: `demo-harness/tests/test_multi_turn_context.py` verifies follow-up turns preserve the same equation, formula, or confusion context where expected.
- [x] **TEST26-05**: `demo-harness/tests/test_teacher_escalation.py` verifies repeated confusion and teacher requests suggest professional teacher support.
- [x] **TEST26-06**: `demo-harness/tests/test_internal_term_leakage.py` verifies assistant-visible output does not contain Codex, AI, model, prompt, demo, backend, mock, provider, or system instruction terms.
- [x] **TEST26-07**: `demo-harness/tests/test_cheating_behavior.py` verifies direct homework-copy requests are redirected to learning steps and do not provide copy-ready final answers first.
- [x] **TEST26-08**: Existing Phase 25 provider behavior tests continue to pass from the repository root.

### Evaluator, Prompt, and Fallback Fixes

- [x] **EVAL26-01**: `demo-harness/harness/evaluate_response.py` exposes focused evaluator helpers for relevance, grade scope, subject scope, no-direct-answer-first, internal terms, teacher escalation need, length, and context consistency.
- [x] **EVAL26-02**: Response evaluation detects irrelevant or generic answers for core demo questions.
- [x] **EVAL26-03**: Response evaluation detects direct-answer-first output for homework-style questions.
- [x] **EVAL26-04**: Response evaluation detects internal-term leakage including Codex, AI, model, prompt, demo, backend, mock, provider, and system instruction.
- [x] **EVAL26-05**: Response evaluation detects high-risk or cheating requests and requires a learning-oriented refusal/redirect.
- [x] **EVAL26-06**: Response evaluation can check multi-turn context consistency for the regression scenarios.
- [x] **PROMPT26-01**: Prompt or repair-prompt rules are updated so repair responses stay concise, relevant, grade-appropriate, step-guided, and free of internal terms.
- [x] **FALLBACK26-01**: Template fallback responses support relevance, subject-scope, confusion, cheating, and teacher-escalation scenarios without overfitting to a single question.

### Demo Flow Stability and Reporting

- [ ] **CHAT26-01**: Student chat QA verifies multi-turn message order, loading completion, retry behavior, teacher request duplicate-submit prevention, and no internal fallback/provider information in UI output.
- [ ] **PARENT26-01**: Parent history/report QA verifies student question records and teacher request records display without prompt/provider/debug details.
- [ ] **TUTOR26-01**: Tutor request-detail QA verifies tutor can see student question context, update status, add notes, and avoid prompt/provider/debug details.
- [ ] **LANG26-01**: English behavior smoke verifies guided explanations are calm, short, clear, relevant, and internal-term-free.
- [ ] **LANG26-02**: German behavior smoke verifies responses are clear for lower-secondary students, avoid technical internal terms, and use product-safe Learning Assistant/teacher support language.
- [ ] **LANG26-03**: French and Italian P1 smoke verifies response language correctness and absence of Codex/internal terms.
- [ ] **REPORT26-01**: `docs/qa/learning-assistant-regression-report.md` records passed cases, failed cases, failure types, provider used, fallback count, P0 behavior failures, known issues, and readiness decision.
- [ ] **README26-01**: README documents Phase 26 Learning Assistant functional QA, behavior goals, non-feature scope, and regression test command.
- [ ] **VERIFY26-01**: Final verification runs `npm install` or records why it is skipped, Python harness tests, `npm run build`, and focused student/tutor/parent flow checks.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 27 Demo Scenario Rehearsal and Feedback Capture

- **SCENARIO27-01**: External demo scenarios are rehearsed for parent, teacher, investor, and partner audiences.
- **FEEDBACK27-01**: Demo feedback is captured, categorized, and converted into product/backend priority notes.
- **PRESENT27-01**: Presentation QA verifies account setup, reset, fallback path, and issue capture before external meetings.

## Out of Scope

Explicitly excluded from v1.24 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New frontend pages | Phase 26 stabilizes Learning Assistant behavior, not product surface area. |
| Broad UI redesign | Existing chat, parent, and tutor surfaces should only receive bug fixes if QA finds issues. |
| Formal AI backend | Production provider architecture remains future backend work. |
| Complex agent framework | The existing harness/router/evaluator should be improved before adding framework complexity. |
| Long-term memory | Multi-turn tests use existing recent context only. |
| Real knowledge graph | Grade and subject scope remain prompt/evaluator constraints for demo QA. |
| Production content safety platform | Phase 26 adds functional behavior checks, not a full safety system. |
| Model fine-tuning | Prompt/evaluator/fallback fixes are sufficient for this milestone. |
| Multi-model scheduling | Provider routing remains simple and local-demo scoped. |
| AWS deployment | This milestone is local/demo QA and bug fixing. |
| Frontend rewriting assistant responses | Learning Assistant behavior should be fixed in the harness, evaluator, prompt, repair, or fallback layers. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| QA26-01 | Phase 137 | Complete |
| RULE26-01 | Phase 137 | Complete |
| RULE26-02 | Phase 137 | Complete |
| RULE26-03 | Phase 137 | Complete |
| RULE26-04 | Phase 137 | Complete |
| BUG26-01 | Phase 137 | Complete |
| DATA26-01 | Phase 138 | Complete |
| TEST26-01 | Phase 138 | Complete |
| TEST26-02 | Phase 138 | Complete |
| TEST26-03 | Phase 138 | Complete |
| TEST26-04 | Phase 138 | Complete |
| TEST26-05 | Phase 138 | Complete |
| TEST26-06 | Phase 138 | Complete |
| TEST26-07 | Phase 138 | Complete |
| TEST26-08 | Phase 138 | Complete |
| EVAL26-01 | Phase 139 | Complete |
| EVAL26-02 | Phase 139 | Complete |
| EVAL26-03 | Phase 139 | Complete |
| EVAL26-04 | Phase 139 | Complete |
| EVAL26-05 | Phase 139 | Complete |
| EVAL26-06 | Phase 139 | Complete |
| PROMPT26-01 | Phase 139 | Complete |
| FALLBACK26-01 | Phase 139 | Complete |
| CHAT26-01 | Phase 140 | Pending |
| PARENT26-01 | Phase 140 | Pending |
| TUTOR26-01 | Phase 140 | Pending |
| LANG26-01 | Phase 140 | Pending |
| LANG26-02 | Phase 140 | Pending |
| LANG26-03 | Phase 140 | Pending |
| REPORT26-01 | Phase 140 | Pending |
| README26-01 | Phase 140 | Pending |
| VERIFY26-01 | Phase 140 | Pending |

**Coverage:**
- v1.24 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.24 roadmap creation*
