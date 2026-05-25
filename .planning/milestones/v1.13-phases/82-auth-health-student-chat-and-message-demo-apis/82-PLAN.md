# Phase 82 Plan: Auth, Health, Student Chat, and Message Demo APIs

## Goal

Stabilize the core student-facing backend demo loop.

## Tasks

- [x] Update `/health` to return demo backend status.
- [x] Add standard demo error response handling.
- [x] Keep login/register/me behavior working with bearer tokens.
- [x] Preserve message attachment metadata in responses.
- [x] Return deterministic demo assistant response text.

## Verification

- [x] Python syntax check passes.
- [x] TestClient smoke confirms health, auth, conversation detail, message send, and teacher-help request path.

