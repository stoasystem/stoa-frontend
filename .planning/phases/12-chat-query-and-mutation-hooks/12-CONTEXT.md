# Phase 12: Chat Query and Mutation Hooks - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Smart discuss, auto-accepted from roadmap and supplied Phase 4 brief

<domain>
## Phase Boundary

Add TanStack Query integration for the Phase 4 chat service functions. This phase creates query keys plus read and mutation hooks; it does not refactor `ChatPage` yet.

</domain>

<decisions>
## Implementation Decisions

### Query Ownership
- Use TanStack Query for chat server state.
- Do not duplicate chat server state into Zustand.
- Keep query hooks in `src/hooks/chat/`.
- Keep query keys in `src/services/chat/chatQueryKeys.ts`.

### Fetching Behavior
- Conversation list query should fetch immediately.
- Conversation detail query should be disabled when no active conversation ID exists.
- Query keys should be stable and derived from `chatQueryKeys`.
- Avoid hard-coded key arrays outside the query key module.

### Mutation Behavior
- Send-message mutation accepts content and posts to the active conversation.
- On send success, invalidate active conversation detail and conversation list queries.
- Teacher-help mutation wraps the backend request endpoint.
- Full optimistic updates are deferred.

### the agent's Discretion
The agent may choose `onSuccess` async style and whether to guard empty conversation IDs inside the mutation hook.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@tanstack/react-query` is already configured through app providers.
- Phase 11 service functions will provide typed async functions for hooks.

### Established Patterns
- Hooks are simple function exports.
- Existing hooks currently live under `src/hooks`, and Phase 4 adds a `src/hooks/chat/` namespace.

### Integration Points
- Phase 13 `ChatPage` will use these hooks.
- Query invalidation must line up with `chatQueryKeys`.

</code_context>

<specifics>
## Specific Ideas

Use invalidation and refetch rather than full optimistic cache updates for Phase 4.

</specifics>

<deferred>
## Deferred Ideas

Optimistic append, rollback, retry, abort generation, and streaming are deferred to Phase 5 or later.

</deferred>
