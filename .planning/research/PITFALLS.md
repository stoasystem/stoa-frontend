# Project Research: Pitfalls for v1.4 Phase 5

**Milestone:** v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow
**Date:** 2026-05-24

## Streaming Pitfalls

- **Assuming one chunk equals one event.** Network chunks can split or combine events. Keep a buffer and split on blank-line event boundaries.
- **Ignoring final decoder flush.** Use `TextDecoder` consistently and handle the remaining buffer after the reader finishes.
- **Treating abort as failure.** User-initiated abort should mark `stopped`, not `failed`.
- **Over-invalidating during each delta.** Invalidate canonical queries only after done/error, not per chunk.
- **Leaking controllers.** Clear the active controller after done, error, or stop.

## State Pitfalls

- **Putting streaming tokens in Zustand.** High-frequency updates will create avoidable global render complexity.
- **Duplicating canonical messages long-term.** Local streaming messages should be temporary and reconciled after query invalidation.
- **Losing attachment IDs on retry.** Failed user messages need enough metadata to retry the same payload.
- **Mixing UI errors.** Message errors, upload validation errors, teacher request errors, and page load errors need separate display surfaces.

## Upload Pitfalls

- **Relying only on backend validation.** Block unsupported file types, oversize files, and too many files before upload.
- **Assuming uploaded means parsed.** Phase 5 can treat `uploaded` as sufficient, but the UI types should allow `processing`, `parsed`, and `failed`.
- **Forgetting conversation association.** Include `conversationId` when available so backend can attach context early.

## Teacher Help Pitfalls

- **Static success message only.** Phase 5 should represent status values, even if polling/manual refresh is simple at first.
- **Overbuilding live teacher chat.** Status cards are in scope; real-time teacher messaging is not.

## Documentation Pitfalls

- **Exposing model provider details.** README must continue to state that Codex or later providers are backend-only.
- **Unclear backend contract.** Streaming event names, file fields, and teacher status enums should be documented for local integration.
