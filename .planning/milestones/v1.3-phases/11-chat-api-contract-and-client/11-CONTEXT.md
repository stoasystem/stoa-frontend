# Phase 11: Chat API Contract and Client - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Smart discuss, auto-accepted from roadmap and supplied Phase 4 brief

<domain>
## Phase Boundary

Define the frontend chat API contract and centralize backend endpoint calls for the Phase 4 conversation, message, conversation creation, and teacher-help APIs. This phase does not wire React UI state; it prepares typed service functions for later hooks and page integration.

</domain>

<decisions>
## Implementation Decisions

### API Contract Shape
- Use camelCase frontend types from the supplied Phase 4 document.
- Include conversation summary and full conversation detail as separate types.
- Keep model-provider details out of frontend types.
- Add teacher-help request/response types even if the backend endpoint is initially a placeholder.

### Service Layer
- Use `src/services/api/httpClient.ts` as the only HTTP transport.
- Keep chat endpoint functions under `src/services/chat/chatApi.ts`.
- Return `response.data` from each service function.
- Do not import service functions directly into presentational components.

### Backend Compatibility
- Prefer the supplied `/conversations` and `/teacher-help/request` endpoint contract.
- Leave room for API-layer mapping if backend returns snake_case.
- Do not implement streaming or WebSocket behavior.
- Do not call any model provider from frontend code.

### the agent's Discretion
The agent may choose exact import type syntax and file ordering as long as repo style is preserved.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/api/httpClient.ts` already reads `VITE_API_BASE_URL` and injects a local auth token.
- `src/types/chat.ts` already contains base chat role/message/conversation types.
- `src/services/chat/chatApi.ts` currently contains an obsolete `/chat` placeholder.

### Established Patterns
- TypeScript uses exported type aliases.
- Imports use `@/` alias and single quotes.
- Files use 2-space indentation and omit semicolons.

### Integration Points
- Phase 12 query hooks will consume `chatApi.ts`.
- Phase 13 `ChatPage` will consume hooks, not raw endpoint functions.

</code_context>

<specifics>
## Specific Ideas

Use the supplied Phase 4 contract exactly unless existing repo constraints require a minor naming adjustment.

</specifics>

<deferred>
## Deferred Ideas

Streaming, file upload, auth enforcement, direct model APIs, and dashboard backend APIs remain out of scope.

</deferred>
