# Research: Architecture for v1.23 Phase 25

## Existing Architecture Touchpoints

Frontend:

- `src/services/chat/chatApi.ts` posts to `/conversations/{conversationId}/messages`.
- `src/types/chat.ts` defines `SendMessageResponse`.
- Frontend fallback currently has a direct-answer demo text that should be revised during Phase 25 so local fallback behavior does not contradict guided-learning rules.

Backend:

- `backend/app/main.py` owns `POST /conversations/{conversation_id}/messages`.
- The endpoint already validates student ownership, inserts the student message, inserts an assistant message, updates the conversation timestamp, and returns both messages.
- Student profile data is stored in `student_profiles` with `grade`, `school_system`, and `primary_subjects`.
- Conversations store `subject` and `grade`.

## Proposed Data Flow

```text
Frontend Chat UI
  -> POST /conversations/{conversationId}/messages
  -> FastAPI demo backend
  -> Load conversation + student profile + recent messages
  -> Python harness builds prompt
  -> Provider router calls Codex provider
  -> Response post-check
  -> Optional one-shot repair
  -> Template fallback if needed
  -> FastAPI saves assistant message
  -> Frontend renders assistant message
```

## Proposed Module Boundaries

```text
demo-harness/harness/build_prompt.py
  Owns prompt assembly from profile, subject, context, and rules.

demo-harness/harness/evaluate_response.py
  Owns forbidden terms, length, direct-answer-first, grade/scope heuristic checks,
  repair decision, and fallback decision metadata.

demo-harness/harness/providers/base.py
  Defines ProviderRequest, ProviderResponse, and LearningProvider.

demo-harness/harness/providers/codex_provider.py
  Wraps local Codex CLI execution.

demo-harness/harness/providers/template_provider.py
  Returns deterministic guided explanations.

demo-harness/harness/providers/router.py
  Selects provider from env, handles timeout/failure/check failure, and falls back.

backend/app/main.py
  Calls the harness and persists messages. It should not own provider logic.
```

## Codex CLI Adapter Design

Recommended local command shape:

```python
subprocess.run(
    [
        "codex",
        "exec",
        "--ephemeral",
        "--sandbox",
        "read-only",
        "--output-last-message",
        output_path,
        "-",
    ],
    input=request.prompt,
    capture_output=True,
    text=True,
    timeout=timeout_seconds,
)
```

Reasons:

- `-` lets the prompt flow through stdin, avoiding shell quoting problems and long command-line limits.
- `--output-last-message` avoids parsing terminal UI output.
- `--ephemeral` avoids persistent Codex sessions for student demo prompts.
- `--sandbox read-only` reduces risk that a provider call mutates the repo.
- Timeout is enforced by Python, not trusted to the provider.

If `--sandbox read-only` blocks local provider operation in practice, the adapter should fail clearly and let the router use the template fallback. The demo must not require broad sandbox bypass.

## Health Check

Add:

```text
GET /health/provider
```

Suggested response:

```json
{
  "ok": true,
  "provider": "codex",
  "fallback": "template",
  "mode": "demo"
}
```

The health check should verify provider selection and optionally run a short bounded Codex availability probe. It must not leak prompts or user data.

## Response Evaluation

Response evaluation should return structured internal metadata:

- `ok`
- `failure_reasons`
- `requires_repair`
- `requires_fallback`
- `teacher_escalation_suggested`

Only the assistant content should go to the frontend unless a future internal debug endpoint is explicitly feature-flagged.

## Production Handoff

The provider interface should be compatible with a future Responses API adapter:

- Provider request can contain prompt, language, student ID, conversation ID, grade level, subject, and context.
- Provider response can contain text plus internal metadata.
- The production provider can later use OpenAI Responses API, structured outputs, streaming, and safety checks without changing frontend Chat API types.

## Architecture Decision

Create a separate harness package and call it from the local FastAPI backend. Keep provider routing and behavior enforcement out of React and out of the endpoint body.
