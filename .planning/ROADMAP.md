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
- ◆ **v1.24 Phase 26: Learning Assistant Functional QA, Multi-Turn Behavior Testing, and Bug Fixing** - Phases 137-140 (planning)

## Phases

### Phase 137: Functional QA Rules, Bug Log, and Readiness Threshold ✅

**Goal:** Define the Learning Assistant functional QA plan, relevance and multi-turn behavior rules, repair workflow, readiness threshold, and bug reproduction process.

**Requirements:** QA26-01, RULE26-01, RULE26-02, RULE26-03, RULE26-04, BUG26-01

**Success criteria:**

1. Functional QA plan documents behavior dimensions, P0 categories, and verification method.
2. Learning Assistant rule docs cover relevance, multi-turn consistency, repair prompt workflow, and demo readiness thresholds.
3. Bug reproduction log template supports repeatable tracking from failure to regression test.
4. Docs explicitly state Phase 26 does not add product features or UI redesign.

**Status:** Complete.

### Phase 138: Multi-Turn Regression Data and Behavior Test Suite ✅

**Goal:** Add the multi-turn test data and focused behavior tests that reproduce relevance, grade, subject, context, escalation, internal-term, and cheating scenarios.

**Requirements:** DATA26-01, TEST26-01, TEST26-02, TEST26-03, TEST26-04, TEST26-05, TEST26-06, TEST26-07, TEST26-08

**Success criteria:**

1. Multi-turn regression JSON includes the eight required scenarios with student profiles, turns, and expected behavior.
2. Focused test modules exist for relevance, grade scope, subject scope, multi-turn context, teacher escalation, internal-term leakage, and cheating behavior.
3. Existing Phase 25 provider tests continue to run from the repo root.
4. The test suite produces actionable failure names that map to the bug reproduction log.

**Status:** Complete.

### Phase 139: Evaluator, Prompt, Repair, and Fallback Stabilization ✅

**Goal:** Improve the harness evaluator, prompt/repair rules, and fallback behavior so detected Learning Assistant behavior bugs are fixed in the harness layer.

**Requirements:** EVAL26-01, EVAL26-02, EVAL26-03, EVAL26-04, EVAL26-05, EVAL26-06, PROMPT26-01, FALLBACK26-01

**Success criteria:**

1. Evaluator exposes focused helper checks for relevance, grade, subject, direct-answer-first, internal terms, teacher escalation need, length, and context consistency.
2. Evaluator detects generic/irrelevant answers, direct homework answers, high-risk or cheating requests, internal terms, and multi-turn context loss for regression scenarios.
3. Repair prompt rules keep responses concise, relevant, grade-appropriate, step-guided, and internal-term-free.
4. Fallback responses support relevance, subject-scope, confusion, cheating, and teacher-escalation scenarios without single-question hardcoding.

**Status:** Complete.

### Phase 140: Demo Flow QA, Regression Report, README, and Final Verification ✅

**Goal:** Verify the Learning Assistant behavior in the demo flow, document regression results, update README, and confirm build/test readiness.

**Requirements:** CHAT26-01, PARENT26-01, TUTOR26-01, LANG26-01, LANG26-02, LANG26-03, REPORT26-01, README26-01, VERIFY26-01

**Success criteria:**

1. Student chat QA covers multi-turn order, loading completion, retry behavior, teacher request duplicate-submit prevention, and no internal fallback/provider output.
2. Parent and tutor QA confirm records/context/status/note flows remain stable and internal debug/provider data is not shown.
3. English, German, French, and Italian behavior smoke coverage is documented at the required priority level.
4. Regression report records pass/fail counts, failure types, provider, fallback count, P0 count, known issues, and readiness decision.
5. README includes Phase 26 Learning Assistant functional QA instructions and final verification passes or records exact blockers.

**Status:** Complete.

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 137 | 6 | QA26-01, RULE26-01, RULE26-02, RULE26-03, RULE26-04, BUG26-01 |
| 138 | 9 | DATA26-01, TEST26-01, TEST26-02, TEST26-03, TEST26-04, TEST26-05, TEST26-06, TEST26-07, TEST26-08 |
| 139 | 8 | EVAL26-01, EVAL26-02, EVAL26-03, EVAL26-04, EVAL26-05, EVAL26-06, PROMPT26-01, FALLBACK26-01 |
| 140 | 9 | CHAT26-01, PARENT26-01, TUTOR26-01, LANG26-01, LANG26-02, LANG26-03, REPORT26-01, README26-01, VERIFY26-01 |

**Total requirements:** 32
**Mapped requirements:** 32
**Unmapped requirements:** 0

## Next Up

Milestone v1.24 is complete and ready for audit/archive.
