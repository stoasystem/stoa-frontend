# Research: Features for v1.23 Phase 25

## Feature Categories

### Provider Abstraction

Table stakes:

- A single provider interface for local demo Learning Assistant generation.
- A Codex provider adapter that hides CLI details from the demo backend.
- A template fallback provider that always returns a guided educational response.
- A router that selects the configured provider, catches failures, and falls back cleanly.
- Provider debug data kept internal.

Differentiators:

- Provider health check endpoint for demo readiness.
- Internal provider logging with failure reasons and no sensitive payloads.
- Future handoff documentation that lets a production provider replace Codex without changing frontend contracts.

### Prompt Harness

Table stakes:

- Prompt construction from student profile, conversation subject, conversation context, and student message.
- Grade-level rules injected into the prompt.
- Subject-scope rules injected into the prompt.
- Guided answer instruction that avoids direct final answers first.
- Teacher escalation instruction for confused, blocked, or dissatisfied students.
- Forbidden internal terms instruction.

Differentiators:

- Prompt templates stored as editable Markdown files.
- Repair prompt path after failed response checks.
- Regression question set with must-include and must-not-include checks.

### Response Guardrails

Table stakes:

- Post-check for forbidden internal terms: `AI`, `Codex`, `model`, `prompt`, `backend`, `demo`, `mock`.
- Post-check for direct-answer-first patterns.
- Post-check for grade-inappropriate terms in known regression cases.
- Post-check for excessive length or overly technical wording.
- Fallback when checks fail after one repair attempt.

Differentiators:

- QA documentation that separates feasible automated checks from manual educator review.
- Behavior test cases for grade scope, subject scope, teacher escalation, and fallback.

### Demo Backend Integration

Table stakes:

- `POST /conversations/{conversation_id}/messages` saves the student message, calls the harness, saves the assistant message, and returns the existing response shape.
- Student profile and conversation metadata are loaded by the backend and passed to the harness.
- `GET /health/provider` returns internal provider readiness metadata.
- Existing streaming endpoint remains compatible.

Differentiators:

- Streaming endpoint can reuse generated final text in chunks without exposing provider internals.
- Internal logs can record fallback usage for pre-demo checks.

### Full Demo QA

Table stakes:

- Student registration/login/chat question/follow-up/teacher support flow.
- Tutor queue/detail/in-progress/note/resolved flow.
- Parent learning history/report/teacher request visibility flow.
- Pricing/mock checkout/referral/support/contact/admin overview smoke flow.
- Build and harness test verification.

Differentiators:

- Provider readiness checklist before external demos.
- Repeatable fallback test where Codex is intentionally unavailable.

## Anti-Features

- User-visible provider labels.
- Direct frontend provider calls.
- Production model orchestration.
- Real payment, AWS, database, or content safety platform work.
- Long-term memory or real curriculum graph.

## Recommended Feature Scope

Phase 25 should ship a local demo provider loop that is credible enough for presentations, but intentionally narrow: provider adapter, harness behavior controls, backend integration, tests, QA docs, and handoff notes.
