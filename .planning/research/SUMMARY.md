# Project Research Summary: v1.4 Phase 5

**Date:** 2026-05-24

## Stack Additions

- No new core frontend dependency is required.
- Use `fetch` plus `ReadableStream.getReader()`, `TextDecoder`, and `AbortController` for `POST /conversations/:conversationId/messages/stream`.
- Keep Axios `httpClient` for JSON and multipart endpoints.
- Keep TanStack Query as the canonical server-state layer and invalidate conversation queries after streaming finishes.

## Feature Table Stakes

- Streaming assistant response with `message_start`, `message_delta`, `message_done`, and `message_error`.
- Stop generation through frontend abort and `stopped` assistant message status.
- Basic failed user-message retry.
- New conversation creation and auto-selection.
- PNG/JPEG/PDF upload with type, size, and count validation.
- Attachment previews and `attachmentIds` in send payload.
- Teacher-help request status display across `pending`, `assigned`, `in_progress`, and `resolved`.

## Watch Out For

- Parse stream events with buffering; do not assume chunk boundaries align with events.
- Do not treat user abort as a normal failed message.
- Keep streaming token updates out of Zustand.
- Preserve failed user message content and attachment IDs for retry.
- Do not add direct model provider SDKs or provider-specific env vars to the frontend.

## Requirement/Roadmap Implications

The milestone should be split by implementation dependencies:

1. Types and service contracts.
2. Streaming hook and local optimistic message state.
3. Upload services and attachment UI.
4. Chat page integration including create conversation, stop, retry, and message display.
5. Teacher-help status workflow.
6. Documentation, build, lint, and local verification.
