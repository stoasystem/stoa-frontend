# Research: Stack for v1.23 Phase 25

## Scope

Phase 25 adds a local-only Learning Assistant provider behind the existing FastAPI demo backend. The frontend remains React/TypeScript/Vite and keeps calling the existing Chat API.

## Current Repository Facts

- The repo has no `demo-harness/` directory yet.
- The current local backend is FastAPI under `backend/app/`.
- `backend/app/main.py` currently returns a fixed assistant message from `POST /conversations/{conversation_id}/messages`.
- The student profile is available from the local SQLite tables through `student_profiles`.
- The frontend already calls `src/services/chat/chatApi.ts` and expects `SendMessageResponse` with `studentMessage` and `assistantMessage`.
- Local `codex` is installed at `/opt/homebrew/bin/codex`.
- Local `codex exec --help` confirms non-interactive execution, stdin prompt support, `--ephemeral`, `--output-last-message`, `--output-schema`, `--json`, `--cd`, `--sandbox`, and model/profile flags.

## OpenAI / Codex Research

Sources checked:

- OpenAI Codex non-interactive mode: https://developers.openai.com/codex/noninteractive
- OpenAI Codex CLI docs: https://developers.openai.com/codex/cli
- OpenAI text generation docs: https://developers.openai.com/api/docs/guides/text
- OpenAI structured outputs docs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI streaming docs: https://developers.openai.com/api/docs/guides/streaming-responses
- OpenAI Responses migration docs: https://developers.openai.com/api/docs/guides/migrate-to-responses

Key findings:

- Codex CLI non-interactive mode is suitable for a local scripted demo bridge, especially with `codex exec` and a prompt passed through stdin.
- For provider-style output capture, `--output-last-message <path>` is safer than parsing rich terminal output.
- For machine-readable final output, `--output-schema <schema.json>` exists, but Phase 25 can keep provider output as text and use Python post-checks unless structured assistant output becomes necessary.
- `--ephemeral` should be used so local demo provider calls do not persist Codex sessions.
- `--sandbox read-only` should be used where possible to reduce risk of provider calls modifying the repo.
- Official OpenAI API guidance recommends the Responses API for new production model integrations. Therefore, the Phase 25 handoff should treat the Codex CLI adapter as local demo infrastructure and document Responses API as the future real provider direction.
- Structured outputs are relevant for a future production provider because they can enforce schema adherence for response parts, teacher escalation suggestions, and safety metadata.
- Streaming over Responses uses SSE-style events. The current STOA frontend already supports a streaming endpoint, but Phase 25 can start with non-streaming provider output and keep streaming as a wrapper over final text unless demo quality requires incremental output.

## Recommended Stack Additions

### Python Harness Package

Add a repo-local package:

```text
demo-harness/
  harness/
    providers/
    build_prompt.py
    evaluate_response.py
    run_learning_assistant.py
  prompts/
  data/
  tests/
```

This matches the Phase 25 brief and keeps provider logic separate from `backend/app/main.py`.

### FastAPI Integration

Keep FastAPI as the only local demo backend. `backend/app/main.py` should call a small harness entry function rather than embedding prompt/provider logic directly.

### Provider Runtime

Use a provider interface with:

- `ProviderRequest`
- `ProviderResponse`
- `LearningProvider`

Adapters:

- `CodexProvider`: calls `codex exec` locally.
- `TemplateProvider`: deterministic fallback.
- `ProviderRouter`: selects provider from environment and falls back on timeout, process failure, failed checks, or forbidden internal terms.

### Environment Variables

Recommended backend/harness env:

```bash
STOA_DEMO_PROVIDER=codex
STOA_DEMO_PROVIDER_FALLBACK=template
STOA_DEMO_PROVIDER_TIMEOUT_SECONDS=60
STOA_DEMO_LANGUAGE_DEFAULT=en
STOA_DEMO_PROVIDER_HEALTH_TIMEOUT_SECONDS=5
```

Frontend env can remain:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=http://localhost:8000
VITE_SHOW_INTERNAL_DEBUG=false
```

## What Not To Add

- No frontend dependency on Codex, OpenAI, provider names, model names, prompt text, or debug output.
- No production OpenAI API integration in this milestone.
- No complex provider registry or queue.
- No database redesign.
- No long-term memory.
- No real content safety platform.

## Stack Decision

Implement Phase 25 as a Python/FastAPI local demo integration using `codex exec` behind a provider interface, with mandatory template fallback and post-checks. Document OpenAI Responses API as the future production handoff target, but do not implement it in Phase 25.
