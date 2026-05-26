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
- ◆ **v1.23 Phase 25: Local Codex Provider Integration for Complete Demo Flow** - Phases 133-136 (planning)

## Phases

### Phase 133: Harness Provider Foundation and Codex Adapter

**Goal:** Establish the local demo provider abstraction, Codex CLI adapter, template fallback, router, logging boundary, and ignored provider logs.

**Requirements:** PROVIDER25-01, PROVIDER25-02, PROVIDER25-03, PROVIDER25-04, PROVIDER25-05, PROVIDER25-06, PROVIDER25-07, PROVIDER25-08

**Success criteria:**

1. Provider interface, Codex provider, template provider, and router modules exist under the Python harness.
2. Codex provider can run through `codex exec` with timeout and final-text capture when the CLI is available.
3. Router falls back to template output when Codex is unavailable, times out, fails, or is rejected.
4. Provider logs are internal, sanitized, and excluded from git.

### Phase 134: Prompt Rules, Response Checks, and Behavior Regression

**Goal:** Build the controlled Learning Assistant prompt harness, response evaluator, repair/fallback behavior, regression data, and behavior tests.

**Requirements:** HARNESS25-01, HARNESS25-02, HARNESS25-03, HARNESS25-04, HARNESS25-05, HARNESS25-06, HARNESS25-07, HARNESS25-08, RESPONSE25-01, RESPONSE25-02, RESPONSE25-03, RESPONSE25-04, RESPONSE25-05, RESPONSE25-06, RESPONSE25-07, RESPONSE25-08

**Success criteria:**

1. Harness prompt construction uses student profile, grade, subjects, conversation context, language, and question.
2. Prompt templates cover base assistant behavior, grade rules, subject rules, teacher escalation, and forbidden internal terms.
3. Response evaluator catches forbidden terms, direct-answer-first output, regression grade/scope violations, excessive length, and missing explanation steps.
4. Regression data and tests cover Codex success, provider failure fallback, timeout handling where feasible, guided answers, scope controls, and teacher escalation.

### Phase 135: Demo Backend Chat Integration and Provider Health

**Goal:** Connect the harness into the existing FastAPI demo backend while preserving frontend Chat API contracts and existing streaming compatibility.

**Requirements:** BACKEND25-01, BACKEND25-02, BACKEND25-03, BACKEND25-04, BACKEND25-05, BACKEND25-06, BACKEND25-07

**Success criteria:**

1. `POST /conversations/{conversationId}/messages` saves the student message, calls the harness, saves the assistant message, and returns the existing response shape.
2. Demo backend passes grade, registered subjects, conversation subject, and recent messages to the harness without sensitive data.
3. `GET /health/provider` reports internal readiness without prompt/user-data leakage.
4. Frontend services/types remain provider-agnostic and fallback copy is guided rather than answer-first or internal.

### Phase 136: Full Demo QA, Readiness Checklist, README, and Handoff

**Goal:** Verify the complete demo loop with Codex/fallback behavior and document readiness, QA evidence, local runbook, and future production-provider handoff.

**Requirements:** QA25-01, QA25-02, QA25-03, QA25-04, QA25-05, QA25-06, QA25-07, QA25-08, QA25-09

**Success criteria:**

1. Provider behavior QA, readiness checklist, and backend provider handoff docs exist and match implemented behavior.
2. README documents Phase 25 local-only provider setup, environment variables, fallback, and user-visible wording constraints.
3. Student, tutor, parent, billing, referral, support/contact, and admin demo flows are checked for regressions.
4. Python harness tests and `npm run build` pass, or exact blockers and mitigations are recorded.

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 133 | 8 | PROVIDER25-01, PROVIDER25-02, PROVIDER25-03, PROVIDER25-04, PROVIDER25-05, PROVIDER25-06, PROVIDER25-07, PROVIDER25-08 |
| 134 | 16 | HARNESS25-01, HARNESS25-02, HARNESS25-03, HARNESS25-04, HARNESS25-05, HARNESS25-06, HARNESS25-07, HARNESS25-08, RESPONSE25-01, RESPONSE25-02, RESPONSE25-03, RESPONSE25-04, RESPONSE25-05, RESPONSE25-06, RESPONSE25-07, RESPONSE25-08 |
| 135 | 7 | BACKEND25-01, BACKEND25-02, BACKEND25-03, BACKEND25-04, BACKEND25-05, BACKEND25-06, BACKEND25-07 |
| 136 | 9 | QA25-01, QA25-02, QA25-03, QA25-04, QA25-05, QA25-06, QA25-07, QA25-08, QA25-09 |

**Total requirements:** 40
**Mapped requirements:** 40
**Unmapped requirements:** 0

## Next Up

**Phase 133: Harness Provider Foundation and Codex Adapter** - Establish the provider interface, Codex CLI adapter, fallback provider, router, logging boundary, and `.gitignore` protection.

Run:

```bash
$gsd-plan-phase 133
```
