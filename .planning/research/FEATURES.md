# Research: Feature Behavior for v1.3 Backend Chat Integration

**Date:** 2026-05-24
**Milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

## Table Stakes

- Conversation list loads from `GET /conversations`.
- Selected conversation detail loads from `GET /conversations/:conversationId`.
- Active conversation defaults to the first loaded conversation when none is selected.
- Sending a message calls `POST /conversations/:conversationId/messages`.
- Successful sends invalidate conversation detail and conversation list caches.
- Pending sends disable input and show assistant thinking.
- Conversation list and conversation detail each expose loading, error, and empty states.
- Teacher-help request calls `POST /teacher-help/request` and exposes pending/success/error feedback.
- Frontend environment configuration points to the backend base URL.
- README documents local FastAPI startup, API docs URL, CORS expectations, and Codex testing-provider strategy.

## Differentiators Deferred

- Streaming assistant response.
- Abort generation.
- Retry failed message.
- Full optimistic message append.
- Real file upload.
- Conversation creation flow beyond typed API support.
- Auth-protected backend integration.
- Dashboard backend data.

## Anti-Features

- Frontend direct calls to OpenAI, Claude, Gemini, DeepSeek, Codex, or any model provider.
- Provider-specific fields leaking into React components.
- WebSocket or streaming response implementation in Phase 4.

## Recommendation

Keep Phase 4 intentionally stable: normal HTTP request/response, invalidation-based refresh, and clear status rendering. Defer richer realtime behavior to Phase 5 after the backend contract is proven.
