# Learning Provider Handoff

## Current Demo Provider Interface

Phase 25 adds a local-only provider boundary under:

```text
demo-harness/harness/providers/
```

Core objects:

- `ProviderRequest`
- `ProviderResponse`
- `LearningProvider`
- `CodexProvider`
- `TemplateProvider`
- `ProviderRouter`

The frontend does not know which provider is selected. It only receives the existing Chat API shape:

```json
{
  "studentMessage": {},
  "assistantMessage": {}
}
```

## Local Codex Adapter

The Codex adapter calls local `codex exec` non-interactively. It is intended only for local testing and demo preparation.

Important behavior:

- Prompt is passed through stdin.
- Final assistant text is captured through `--output-last-message`.
- Calls are bounded by `STOA_DEMO_PROVIDER_TIMEOUT_SECONDS`.
- Calls run from an empty temporary working directory with a scrubbed environment.
- Ephemeral mode, ignored project rules, and read-only sandboxing are requested where feasible.
- Provider failures raise internal errors for router fallback.

This adapter should not be reused as production model infrastructure.

## Template Fallback

The template fallback exists so external demos do not fail when Codex is unavailable, slow, unauthenticated, or rejected by behavior checks.

Fallback returns natural Learning Assistant text and does not expose provider failures to students.

## Prompt Rules

Prompt construction lives in:

```text
demo-harness/harness/build_prompt.py
demo-harness/prompts/
```

The prompt includes:

- Student grade.
- Grade band.
- Registered subjects.
- Conversation subject.
- Recent conversation context.
- Student question.
- Guided-answer instruction.
- Grade-level instruction.
- Subject-scope instruction.
- Teacher escalation instruction.
- Forbidden internal-term instruction.

## Response Post-Checks

Response checks live in:

```text
demo-harness/harness/evaluate_response.py
```

Checks cover:

- Forbidden internal terms.
- Direct final answer first.
- Known lower-secondary scope violations.
- Known subject-scope violations.
- Excessive length.
- Missing guided steps.

The harness can attempt one repair and then fallback to template output.

## Teacher Escalation Rules

Teacher support should be suggested when:

- The student asks for a teacher.
- The student says they are still confused.
- The student repeats that an explanation did not help.
- The question is outside saved subject scope.
- The student needs personalized review of work, writing, diagrams, or homework.

The user-visible phrase should remain product language such as `professional teacher support`.

## Frontend Expectations

Frontend should keep calling:

```text
POST /conversations/{conversationId}/messages
```

Frontend should expect:

- `studentMessage`
- `assistantMessage`
- existing message IDs, roles, content, created timestamps, and status.

Frontend should not expect:

- provider name
- model name
- prompt text
- repair state
- fallback reason
- internal debug details

## Backend Expectations

Backend owns:

- Student profile lookup.
- Conversation lookup.
- Provider selection.
- Prompt construction.
- Response checks.
- Fallback.
- Internal provider logging.
- Message persistence.

Backend must not pass passwords, tokens, full uploaded file contents, or unnecessary private data into provider logs.

## Future Production Provider Requirements

A future production provider should:

- Live behind the backend provider interface.
- Use a formal provider API, such as OpenAI Responses API or another backend-owned service.
- Support structured outputs for assistant content and escalation metadata.
- Include observability, rate limits, cost controls, safety policy, privacy review, retry strategy, and incident handling.
- Keep provider/model details out of normal user-facing UI.
- Preserve the existing frontend Chat API contract unless a later milestone explicitly changes it.

## What Not To Expose To Frontend

Do not expose these as normal user-visible fields or copy:

- Codex
- provider
- model
- prompt
- backend
- demo
- mock
- raw provider error
- fallback reason
- local file paths
- tokens or credentials
