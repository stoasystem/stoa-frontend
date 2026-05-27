# Summary: Fix Chat AI Provider and General Scope

Date: 2026-05-27

## Changes

- Updated `npm run demo:backend` so the local backend starts with `STOA_DEMO_PROVIDER=codex` and template fallback.
- Changed the provider router default from template to Codex, preserving template fallback.
- Added `--skip-git-repo-check` to the Codex CLI provider command so ephemeral temporary directories are callable.
- Stopped treating `General` chat conversations as outside the student's saved Mathematics/Physics scope.
- Added regression tests for Codex default routing, the temp-directory CLI flag, and General-subject fallback behavior.

## Verification

- `backend/.venv/bin/python -m unittest discover -s demo-harness/tests`
- Direct Codex provider smoke returned provider `codex`.
- Backend chat API smoke returned a conversational greeting/subject-selection answer instead of the repeated scope redirect.
- Browser smoke on `/chat` confirmed the visible response no longer includes the incorrect saved-subject scope text.
- `npm run lint`
- `npm run build`
