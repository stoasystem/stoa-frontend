# Phase 198 Plan

## Goal

Verify the profile-to-chat answer-language flow through targeted tests and frontend quality gates.

## Tasks

1. Add harness language regression tests.
   - Verify English, German, French, and Italian template responses.
   - Verify out-of-scope language-specific fallback stays valid.

2. Add backend smoke tests.
   - Register a student with an answer-language preference.
   - Read and update profile language.
   - Send a chat message and verify response language follows the saved profile value.

3. Run verification commands.
   - Python unittest discovery for harness tests.
   - Backend unittest discovery.
   - `npm run lint`.
   - `npm run build`.

4. Record verification status.

