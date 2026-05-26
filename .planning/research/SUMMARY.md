# Research Summary: v1.23 Phase 25

## Stack Additions

- Add a `demo-harness/` Python package for prompt construction, response evaluation, provider adapters, prompts, regression data, and tests.
- Integrate the harness into the existing FastAPI demo backend in `backend/app/main.py`.
- Use local `codex exec` as the demo provider bridge when available.
- Use template fallback for all provider failures and failed response checks.
- Keep frontend Chat API and TypeScript response types unchanged.

## Key Technical Findings

- Local Codex CLI is installed and supports non-interactive `codex exec`.
- `codex exec` supports stdin prompts, `--ephemeral`, `--sandbox read-only`, `--output-last-message`, `--output-schema`, and `--json`.
- For Phase 25, the safest adapter captures final text through `--output-last-message` and enforces a Python timeout.
- OpenAI's current API guidance recommends the Responses API for new production text/model integrations. Phase 25 should document that future real providers belong behind the backend provider layer and should not reuse frontend-facing Codex concepts.
- Structured Outputs are relevant for a future production provider, but Phase 25 can use text output plus deterministic post-checks.
- Existing FastAPI chat endpoint already has the right persistence flow; it needs to replace the fixed assistant text with a harness call.

## Feature Table Stakes

- Provider interface.
- Codex provider adapter.
- Template fallback provider.
- Provider router with env selection and fallback.
- Prompt templates for base assistant behavior, grade rules, subject rules, and teacher escalation rules.
- Response evaluator for internal terms, direct-answer-first behavior, grade/scope checks, answer length, and step explanation.
- Optional one-shot repair before fallback.
- `GET /health/provider`.
- Regression question data.
- Provider behavior tests.
- QA docs and runbook.
- Full demo flow verification.

## Watch Outs

- Do not expose `Codex`, `model`, `provider`, `prompt`, `backend`, `demo`, or `mock` in user-facing UI.
- Do not let Codex CLI mutate the workspace during provider calls.
- Do not treat CLI integration as production backend architecture.
- Do not overbuild provider pooling, queues, database, memory, or AWS deployment.
- Do not return raw provider failures to users.
- Update existing frontend/backend fallback text that directly gives answers or mentions demo/provider internals.

## Recommended Roadmap Shape

Continue phase numbering after Phase 132:

- Phase 133: Harness provider foundation and Codex adapter.
- Phase 134: Prompt rules, response checks, regression tests, and fallback behavior.
- Phase 135: Demo backend chat/health integration and frontend contract cleanup.
- Phase 136: Full demo flow QA, readiness checklist, README, and provider handoff docs.

## Sources

- https://developers.openai.com/codex/noninteractive
- https://developers.openai.com/codex/cli
- https://developers.openai.com/api/docs/guides/text
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/streaming-responses
- https://developers.openai.com/api/docs/guides/migrate-to-responses
