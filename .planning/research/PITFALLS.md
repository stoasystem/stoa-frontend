# Research: Pitfalls for v1.23 Phase 25

## Pitfall: Treating Codex CLI as a Production Provider

Risk:

- Codex CLI is a local coding-agent workflow, not the formal production backend provider layer for a learning product.

Prevention:

- Name the adapter `CodexProvider` internally but document it as local demo infrastructure only.
- Add handoff notes that future production integration should use a backend-owned provider, likely OpenAI Responses API or another formal provider API.
- Keep `STOA_DEMO_PROVIDER` scoped to backend/harness env only.

## Pitfall: Provider Details Leaking Into UI

Risk:

- Existing Phase 18/23 release locks explicitly avoid user-visible internal terms.
- A failed provider call could accidentally return "Codex failed", "model failed", or "demo provider unavailable".

Prevention:

- Add forbidden-term post-checks.
- Use sanitized fallback text.
- Do not include provider fields in Chat API responses.
- Keep debug behind logs or a future internal endpoint only.

## Pitfall: Direct Answers Instead of Guided Learning

Risk:

- The current frontend mock fallback says, "For x squared equals 9, x is 3 or -3."
- Codex may also answer directly unless the harness enforces behavior.

Prevention:

- Update frontend mock fallback copy and backend fallback copy to guided language.
- Prompt with no-direct-answer-first rules.
- Add regression tests for direct-answer-first patterns.
- Reject or repair responses that start with final-answer language.

## Pitfall: Weak Grade and Subject Scope Enforcement

Risk:

- Simple prompt rules alone may not prevent out-of-scope concepts.

Prevention:

- Inject grade and subject rules into prompt.
- Add deterministic checks for regression cases such as calculus terms for lower-secondary students.
- Handle out-of-subject questions gently by redirecting to registered subjects or teacher support.
- Document that this is demo guardrail coverage, not a full content safety platform.

## Pitfall: Codex Timeout Breaking the Demo

Risk:

- CLI provider calls can be slow, unavailable, unauthenticated, or blocked by local config.

Prevention:

- Enforce Python `subprocess.run(..., timeout=...)`.
- Add `STOA_DEMO_PROVIDER_TIMEOUT_SECONDS`.
- Always route to template fallback on timeout.
- Add a pre-demo provider readiness checklist.

## Pitfall: Provider Call Mutates Workspace

Risk:

- Codex is a coding agent and can normally read/write/run commands depending on mode.

Prevention:

- Use `--ephemeral`.
- Use `--sandbox read-only`.
- Avoid passing repo-editing instructions.
- Keep provider prompt focused on returning a Learning Assistant answer only.
- Treat any failure to run read-only as fallback-worthy.

## Pitfall: Over-Logging Sensitive Data

Risk:

- Provider logs might capture private student text or uploaded file contents.

Prevention:

- Log provider selected, fallback used, failure category, timeout, and optional regression case ID.
- Do not log passwords, tokens, full uploaded file contents, or full private chat content.
- Add `demo-harness/logs/` to `.gitignore`.

## Pitfall: Breaking Existing Demo Flows

Risk:

- Chat endpoint changes could disrupt tutor, parent, billing, referral, contact, or admin flows.

Prevention:

- Keep response shapes unchanged.
- Add targeted backend tests and full demo QA.
- Run build and existing smoke scripts after integration.

## Pitfall: Over-Engineering the Harness

Risk:

- Building a formal provider system, queue, database schema, or safety platform would exceed Phase 25.

Prevention:

- Use a small Protocol-based provider interface.
- Keep fallback deterministic.
- Keep storage unchanged except existing message persistence.
- Put future production requirements in `docs/backend-integration/learning-provider-handoff.md`.
