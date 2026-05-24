# Phase 9: Mock Chat Interface - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous execution)

<domain>
## Phase Boundary

Build the `/chat` product UI with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
</domain>

<decisions>
## Implementation Decisions

- Use local `useMockChat` state for Phase 3 only.
- Keep all chat UI components props-driven so Phase 4 can swap in TanStack Query data.
- Use a full-height chat layout rather than the generic `AppLayout`, because chat needs a persistent sidebar and input rail.
</decisions>

<code_context>
## Existing Code Insights

- `/chat` already routes to `ChatPage`.
- UI primitives, TailwindCSS, lucide-react, and `@/*` imports are available.
- Phase 8 added mock conversations and updated chat types.
</code_context>

<specifics>
## Specific Ideas

- Hide desktop sidebar on small screens.
- Append student messages immediately.
- Show AI thinking state before appending a delayed mock assistant response.
</specifics>

<deferred>
## Deferred Ideas

- Mobile conversation drawer, real conversation creation, API-backed messages, real streaming, and file upload are deferred.
</deferred>
