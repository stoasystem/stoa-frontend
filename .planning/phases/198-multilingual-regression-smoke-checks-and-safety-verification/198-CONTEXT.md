# Phase 198: Multilingual Regression, Smoke Checks, and Safety Verification - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

The profile-to-chat language flow is verified through targeted tests, browser checks, copy safety scans, and standard frontend quality gates.
</domain>

<decisions>
## Implementation Decisions

### Test layers

Use harness unit tests for answer-language fallback behavior and backend TestClient tests for end-to-end registration/profile/chat propagation.

### Browser verification

Run a targeted local browser smoke only if the dev server starts cleanly after build/lint. Otherwise record the command-level verification and any blocker.
</decisions>

<code_context>
## Existing Code Insights

- Harness tests use `python -m unittest discover -s demo-harness/tests`.
- No backend test directory exists yet, but FastAPI TestClient can exercise the local app without starting a server.
- Frontend quality gates are `npm run lint` and `npm run build`.
</code_context>

<specifics>
## Specific Ideas

- Add `demo-harness/tests/test_response_language.py`.
- Add `backend/tests/test_preferred_answer_language.py`.
- Use a temp SQLite DB for backend tests.
</specifics>

<deferred>
## Deferred Ideas

- Full Playwright coverage for this feature.
- CI integration for backend Python tests.
</deferred>

