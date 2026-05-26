# Phase 135 Plan: Demo Backend Chat Integration and Provider Health

## Goal

Wire the harness into FastAPI while preserving frontend API contracts.

## Tasks

- [x] Add backend import path for `demo-harness`.
- [x] Add provider health endpoint.
- [x] Update chat send endpoint to call the harness.
- [x] Pass student grade, registered subjects, conversation subject, and recent messages to the harness.
- [x] Keep response shape unchanged.
- [x] Update frontend/backend fallback wording to guided Learning Assistant language.

## Verification

- Run Python syntax/import checks.
- Run harness unit tests.
- Run backend smoke with TestClient where feasible.
- Run TypeScript build.

