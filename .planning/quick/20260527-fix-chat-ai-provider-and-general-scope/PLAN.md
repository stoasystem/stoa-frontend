# Quick Task: Fix Chat AI Provider and General Scope

Date: 2026-05-27

## Problem

Student chat is receiving the same canned subject-scope response from the local backend. Provider health shows the demo backend is running with the template provider instead of the local Codex provider, and the template fallback treats `General` chat conversations as outside the student's saved Mathematics/Physics subjects.

## Scope

- Make the local demo backend use the Codex provider by default with template fallback.
- Keep the fallback reliable when Codex is unavailable.
- Stop treating `General` chat conversations as outside subject scope.
- Add regression coverage for general chat fallback behavior.
- Verify backend tests and frontend build.

## Verification

- Backend harness tests pass.
- Backend smoke confirms provider health selects Codex after restart.
- Chat message smoke no longer returns the repeated saved-subject scope response for a general greeting.
- `npm run build` passes.
