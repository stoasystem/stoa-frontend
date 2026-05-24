# Phase 13: Backend-Driven Chat Page and UI States - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Smart discuss plus frontend-design guidance

<domain>
## Phase Boundary

Switch `/chat` from `useMockChat` to backend-backed TanStack Query hooks, update component props for backend summary/detail data, and add visible loading, error, empty, pending, and operation feedback states. Preserve the existing quiet STOA product UI rather than broad redesigning the app.

</domain>

<decisions>
## Implementation Decisions

### Data Flow
- `ChatPage` owns only active conversation ID and operation feedback state.
- Conversation list comes from `useConversationsQuery`.
- Active conversation detail comes from `useConversationQuery`.
- Send-message and teacher-help actions use mutation hooks.

### UI State Model
- Full-page list loading/error/empty states gate the sidebar/page shell.
- Conversation detail loading/error/empty states appear in the main message area.
- Send pending disables chat input and shows assistant thinking.
- Operation errors use inline text near the relevant action instead of adding a toast dependency.

### Component Compatibility
- `ConversationSidebar` and `ConversationListItem` accept `ConversationSummary[]`.
- `ConversationListItem` does not require latest message content from summary responses.
- `ChatInput` accepts `disabled`.
- `TeacherEscalationCard` accepts action, pending state, and optional feedback.

### Design Direction
- Follow the existing STOA UI: restrained, utilitarian, education-focused, built for repeated student use.
- Improve state clarity through small inline status surfaces, not a marketing-style redesign.
- Use existing shadcn-style primitives and lucide icons.
- Avoid nested cards and oversized hero-like treatment inside the chat tool.

### the agent's Discretion
The agent may refine microcopy and spacing where needed to make loading/error/empty states feel polished.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ChatHeader`, `ChatInput`, `ChatMessageList`, `ConversationSidebar`, `ConversationListItem`, `TeacherEscalationCard`.
- Common `LoadingState`, `ErrorState`, and `EmptyState`.
- UI primitives: `Button`, `Card`, `Textarea`.

### Established Patterns
- Chat layout uses full-height flex with sidebar and main column.
- Components are props-driven and styled with Tailwind utility classes.
- Existing UI is restrained and product-tool oriented.

### Integration Points
- `ChatPage` is the only route assembly point for this phase.
- Component props must align with Phase 11/12 types and hooks.

</code_context>

<specifics>
## Specific Ideas

The frontend-design direction for this phase is "quiet learning cockpit": compact, calm, clear state changes, no decorative redesign.

</specifics>

<deferred>
## Deferred Ideas

Mobile conversation drawer, streaming visuals, upload flow, retry controls, and full optimistic message rendering are deferred.

</deferred>
