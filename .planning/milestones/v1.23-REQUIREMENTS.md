# Requirements: STOA Frontend

**Defined:** 2026-05-26
**Milestone:** v1.23 Phase 25: Local Codex Provider Integration for Complete Demo Flow
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent final demo flows, controlled Learning Assistant behavior, and a clean path to future real backend integration.

## v1.23 Requirements

Requirements for Phase 25. Each requirement maps to exactly one roadmap phase.

### Provider Foundation

- [x] **PROVIDER25-01**: Developers can use a typed Python provider interface with `ProviderRequest`, `ProviderResponse`, and `LearningProvider` so local demo providers are replaceable.
- [x] **PROVIDER25-02**: Developers can run a Codex provider adapter that invokes local `codex exec` non-interactively with bounded timeout and captured final text.
- [x] **PROVIDER25-03**: The Codex provider adapter uses stdin or an equivalent safe input path so long prompts do not depend on shell quoting.
- [x] **PROVIDER25-04**: The Codex provider adapter runs in a local-demo-safe mode such as ephemeral/read-only where feasible and fails clearly when unavailable.
- [x] **PROVIDER25-05**: Developers can use a template fallback provider that returns a guided Learning Assistant response when Codex is unavailable or rejected.
- [x] **PROVIDER25-06**: Developers can use a provider router that selects the configured provider from environment variables and automatically falls back on provider errors, timeouts, failed checks, or forbidden terms.
- [x] **PROVIDER25-07**: Provider logging records provider selection, fallback usage, timeout, and failure category without passwords, tokens, full file contents, or full private chat transcripts.
- [x] **PROVIDER25-08**: `.gitignore` excludes local provider logs such as `demo-harness/logs/`.

### Prompt Harness and Behavior Rules

- [x] **HARNESS25-01**: The Python harness can build a Learning Assistant prompt from student profile, grade level, registered subjects, conversation subject, recent context, language, and the student question.
- [x] **HARNESS25-02**: Prompt templates exist for base Learning Assistant behavior, grade rules, subject rules, and teacher escalation rules.
- [x] **HARNESS25-03**: The prompt instructs the assistant to guide understanding before any final answer and to use step-by-step explanations suitable for the student.
- [x] **HARNESS25-04**: The prompt injects grade-level constraints so lower-secondary students are not given advanced concepts such as calculus unless the question is explicitly about scope boundaries.
- [x] **HARNESS25-05**: The prompt injects subject-scope constraints so questions outside registered subjects are handled gently without pretending to provide full unsupported instruction.
- [x] **HARNESS25-06**: The prompt includes teacher escalation guidance for confused, dissatisfied, blocked, or repeated-help-needed students.
- [x] **HARNESS25-07**: The prompt forbids user-visible internal terms including Codex, AI, model, prompt, backend, demo, mock, and provider.
- [x] **HARNESS25-08**: The harness can perform one repair attempt when a provider response fails behavior checks before using fallback.

### Response Quality and Regression Tests

- [x] **RESPONSE25-01**: Response evaluation rejects or repairs answers that expose forbidden internal terms.
- [x] **RESPONSE25-02**: Response evaluation rejects or repairs answers that begin with a direct final answer instead of guided explanation.
- [x] **RESPONSE25-03**: Response evaluation detects known grade-scope violations in the demo regression set.
- [x] **RESPONSE25-04**: Response evaluation detects known subject-scope violations in the demo regression set.
- [x] **RESPONSE25-05**: Response evaluation rejects or repairs answers that are excessively long, overly technical, or lack explanatory steps.
- [x] **RESPONSE25-06**: `demo-harness/data/demo_question_regression.json` contains at least the eight required regression cases for math, physics, out-of-grade, out-of-subject, follow-up, and teacher escalation behavior.
- [x] **RESPONSE25-07**: Behavior tests verify Codex success, Codex failure fallback, timeout handling where feasible, forbidden-term rejection, guided-answer behavior, grade scope, subject scope, and teacher escalation suggestions.
- [x] **RESPONSE25-08**: User-visible provider failure text is natural Learning Assistant/support language and never says Codex, model, prompt, backend, demo, mock, or provider failed.

### Demo Backend and Frontend Contract

- [x] **BACKEND25-01**: `POST /conversations/{conversationId}/messages` saves the student message, calls the harness, saves the assistant message, and returns the existing `studentMessage` plus `assistantMessage` response shape.
- [x] **BACKEND25-02**: The demo backend loads student grade and registered subjects from local demo state before calling the harness.
- [x] **BACKEND25-03**: The demo backend passes conversation subject and recent messages to the harness without sending passwords, tokens, or uploaded file contents.
- [x] **BACKEND25-04**: `GET /health/provider` reports internal provider readiness, selected provider, fallback provider, and demo mode without exposing prompts or user data.
- [x] **BACKEND25-05**: The existing streaming chat endpoint remains compatible with the harness-backed assistant response.
- [x] **BACKEND25-06**: Frontend chat services and types remain provider-agnostic and do not add Codex, model, provider, prompt, or debug fields to normal Chat API responses.
- [x] **BACKEND25-07**: Existing frontend and backend fallback copy that directly gives answers or mentions demo/provider internals is replaced with guided Learning Assistant language.

### QA, Documentation, and Handoff

- [x] **QA25-01**: `docs/qa/codex-provider-behavior-qa.md` documents provider readiness, timeout, fallback, forbidden-term, grade-scope, subject-scope, guided-answer, and teacher escalation checks.
- [x] **QA25-02**: `docs/backend-integration/learning-provider-handoff.md` documents the demo provider interface, Codex adapter, prompt rules, response checks, teacher escalation rules, frontend expectations, and future production provider requirements.
- [x] **QA25-03**: README documents Phase 25 local Codex provider integration, environment variables, local-only boundary, fallback behavior, and the rule that user-facing UI must never mention Codex.
- [x] **QA25-04**: A provider readiness checklist exists for demo operators before running an external presentation.
- [x] **QA25-05**: Full student flow QA verifies registration/login, chat question, guided answer, follow-up, and professional teacher support request.
- [x] **QA25-06**: Full tutor flow QA verifies request list, detail, in-progress status, note, and resolved status.
- [x] **QA25-07**: Full parent flow QA verifies child learning history, report, and teacher request record visibility.
- [x] **QA25-08**: Full commercial/support/admin flow QA verifies pricing, mock checkout, referral, support/contact, and admin overview are not regressed.
- [x] **QA25-09**: Final verification runs the Python harness tests and `npm run build`, or records exact blockers with mitigation.

## Future Requirements

Deferred to later milestones. Tracked but not in the current roadmap.

### Phase 26 Demo Reliability and Presentation Readiness

- **SCRIPT26-01**: Demo scenarios are scripted and resettable for external presentation rehearsals.
- **RELIABILITY26-01**: End-to-end demo reliability is tested repeatedly under presentation conditions.
- **RESET26-01**: Demo reset can restore all flows, provider mode, and seed state predictably.
- **INCIDENT26-01**: Demo incident response and final fallback strategy are documented.

### Future Production Provider

- **PRODPROVIDER-01**: A real backend-owned provider adapter can replace the local Codex CLI adapter without frontend contract changes.
- **PRODPROVIDER-02**: Production provider integration can use a formal API such as OpenAI Responses API with structured outputs, safety controls, monitoring, and billing owned by the backend.
- **PRODPROVIDER-03**: Production teacher escalation rules, safety policy, privacy review, and provider observability are defined outside the frontend demo repository.

## Out of Scope

Explicitly excluded from v1.23 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Formal AI backend | Phase 25 is local testing/demo provider integration only. |
| Production model service | Codex CLI is a local demo bridge, not production infrastructure. |
| Provider billing | Billing belongs to future backend/provider operations. |
| Complex provider pool | A single configured provider plus fallback is enough for demo reliability. |
| Production queue | Local synchronous demo flow is sufficient for Phase 25. |
| Database redesign | Existing local demo persistence should be reused. |
| Long-term memory | Conversation memory beyond existing local messages is outside this milestone. |
| Real curriculum knowledge graph | Grade/subject checks are prompt and regression controls, not formal curriculum intelligence. |
| Full content safety platform | Phase 25 adds simple behavior checks only. |
| AWS Lambda/API Gateway deployment | Cloud deployment is outside this local demo provider milestone. |
| Direct frontend calls to Codex or OpenAI | Frontend must remain coupled only to STOA backend APIs. |
| User-visible provider/debug wording | Codex/model/provider/prompt/backend/demo/mock details are internal only. |
| Real payment processing | Billing flow remains the existing mock/virtual demo flow. |
| New product modules or UI redesign | Phase 25 stabilizes provider-backed demo behavior without broad product expansion. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROVIDER25-01 | Phase 133 | Done |
| PROVIDER25-02 | Phase 133 | Done |
| PROVIDER25-03 | Phase 133 | Done |
| PROVIDER25-04 | Phase 133 | Done |
| PROVIDER25-05 | Phase 133 | Done |
| PROVIDER25-06 | Phase 133 | Done |
| PROVIDER25-07 | Phase 133 | Done |
| PROVIDER25-08 | Phase 133 | Done |
| HARNESS25-01 | Phase 134 | Done |
| HARNESS25-02 | Phase 134 | Done |
| HARNESS25-03 | Phase 134 | Done |
| HARNESS25-04 | Phase 134 | Done |
| HARNESS25-05 | Phase 134 | Done |
| HARNESS25-06 | Phase 134 | Done |
| HARNESS25-07 | Phase 134 | Done |
| HARNESS25-08 | Phase 134 | Done |
| RESPONSE25-01 | Phase 134 | Done |
| RESPONSE25-02 | Phase 134 | Done |
| RESPONSE25-03 | Phase 134 | Done |
| RESPONSE25-04 | Phase 134 | Done |
| RESPONSE25-05 | Phase 134 | Done |
| RESPONSE25-06 | Phase 134 | Done |
| RESPONSE25-07 | Phase 134 | Done |
| RESPONSE25-08 | Phase 134 | Done |
| BACKEND25-01 | Phase 135 | Done |
| BACKEND25-02 | Phase 135 | Done |
| BACKEND25-03 | Phase 135 | Done |
| BACKEND25-04 | Phase 135 | Done |
| BACKEND25-05 | Phase 135 | Done |
| BACKEND25-06 | Phase 135 | Done |
| BACKEND25-07 | Phase 135 | Done |
| QA25-01 | Phase 136 | Done |
| QA25-02 | Phase 136 | Done |
| QA25-03 | Phase 136 | Done |
| QA25-04 | Phase 136 | Done |
| QA25-05 | Phase 136 | Done |
| QA25-06 | Phase 136 | Done |
| QA25-07 | Phase 136 | Done |
| QA25-08 | Phase 136 | Done |
| QA25-09 | Phase 136 | Done |

**Coverage:**
- v1.23 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after v1.23 roadmap creation*
