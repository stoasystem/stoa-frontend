# Project Research: Stack for v1.4 Phase 5

**Milestone:** v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow
**Date:** 2026-05-24

## Summary

No new core frontend framework is needed. The existing React, TypeScript, Vite, TanStack Query, Axios, and local component stack is enough for Phase 5.

The main stack decision is to use browser `fetch` for the streaming endpoint while keeping Axios for normal JSON and multipart endpoints. MDN documents that a fetch `Response.body` is a `ReadableStream`, which can be consumed through `getReader()`. This maps cleanly to `POST /conversations/:conversationId/messages/stream`, where the request body includes content and attachment IDs.

Server-Sent Events remain a good wire format, but `EventSource` is not the right frontend client for this contract because it is GET-oriented and does not send the POST JSON payload Phase 5 needs. The frontend can still parse an SSE-style `text/event-stream` response over fetch.

## Recommended Stack Changes

- Add no new runtime dependency for streaming; use `fetch`, `ReadableStream.getReader()`, `TextDecoder`, and `AbortController`.
- Keep `httpClient`/Axios for `POST /files`, `GET /files/:fileId`, `POST /teacher-help/request`, and `GET /teacher-help/request/:requestId`.
- Keep TanStack Query for conversation list/detail, create conversation mutation, file upload mutation, and teacher-help status query/mutation.
- Keep local React state for high-frequency streaming message content and pending attachments.
- Avoid putting token/chunk updates in Zustand.

## Integration Points

- `src/services/chat/chatStreamApi.ts`: fetch streaming client and event parser.
- `src/hooks/chat/useStreamingChat.ts`: local optimistic messages, assistant placeholder, abort, failed/stopped states, canonical query invalidation.
- `src/services/files/fileApi.ts`: multipart upload through shared `httpClient`.
- `src/services/teacherHelp/teacherHelpApi.ts`: request and status retrieval through shared `httpClient`.
- `src/hooks/files/useFileUploadMutation.ts`: file upload mutation.
- `src/hooks/chat/useCreateConversationMutation.ts`: create conversation mutation plus query invalidation.

## What Not To Add

- No direct OpenAI, Claude, Gemini, DeepSeek, or Codex SDK dependency.
- No WebSocket dependency for Phase 5.
- No global store for streaming token updates.
- No OCR/PDF client parser dependency; parsing remains backend-owned.
- No toast library unless existing UI feedback proves insufficient.

## Sources

- MDN, `ReadableStream`: fetch exposes `Response.body` as a readable stream and supports `getReader()`.
- MDN, `Using readable streams`: stream consumption pattern uses a reader and repeated `read()` calls.
- MDN, `Using server-sent events`: SSE uses `text/event-stream` and named events in a line-oriented format.
- TanStack Query docs: mutations and invalidation are the intended path for refreshing canonical server state after writes.
