# Research Summary: v1.2 Core Product UI

**Date:** 2026-05-24
**Milestone:** v1.2 Core Product UI

## Scope

This research supports the Phase 3 STOA frontend milestone: a mock-driven chat UI and student dashboard prototype. It does not expand scope into backend integration, real streaming, real upload, authentication, payment, or production deployment.

## Sources Consulted

- Nielsen Norman Group, conversational UI guidance and chatbot usability patterns: https://www.nngroup.com/articles/chatbots/
- Microsoft Fluent 2, waiting and loading UX guidance: https://fluent2.microsoft.design/wait-ux
- Material Design, responsive layout and component guidance: https://m3.material.io/
- WAI-ARIA Authoring Practices, form and interactive control accessibility patterns: https://www.w3.org/WAI/ARIA/apg/

## Key Findings

### Stack Additions

No new libraries are required for this milestone. The existing stack already includes React, TypeScript, Vite, React Router, TailwindCSS, shadcn-style primitives, lucide-react, TanStack Query, Zustand, and Axios.

Use only local components and mock data for Phase 3. Keep TanStack Query and Axios available for Phase 4 but do not force them into mock chat state.

### Feature Table Stakes

- A chat workspace should make the active conversation obvious.
- Message history should visually separate student and assistant messages.
- Sending a message should show immediate local feedback.
- Waiting states should be brief, specific, and located where the response will appear.
- Upload and teacher-help affordances should be visible but clearly placeholder-level.
- Dashboard cards should be scannable and grouped by learning progress, recent activity, weak topics, and teacher feedback.
- Empty, loading, and error patterns should remain available through existing common components, even if mock data is populated by default.

### Architecture Guidance

- Keep UI components props-driven: sidebars receive conversations, message lists receive messages, dashboard cards receive typed arrays.
- Keep mock state isolated in `useMockChat` so Phase 4 can replace it with `useConversationsQuery`, `useConversationQuery`, and `useSendMessageMutation`.
- Keep mock data under `src/data/` and shared contracts under `src/types/`.
- Avoid embedding API assumptions in presentational components. Future endpoints can map into the same component props.
- Keep dashboard and chat page assembly thin; complex interaction belongs in hooks or future query/mutation modules.

### Watch Outs

- Do not overbuild dashboard analytics before the core chat flow is demonstrable.
- Do not introduce global state for mock chat unless cross-route persistence becomes necessary.
- Avoid fake streaming UI that implies backend behavior Phase 3 does not support.
- Keep mobile requirements modest: hide sidebar on small screens, preserve message/input usability, and avoid a drawer until a later phase.
- Do not treat placeholder teacher escalation as a completed business workflow.

## Recommendation

Proceed with a three-phase roadmap:

1. Phase 8: Define product UI contracts and mock data.
2. Phase 9: Build the mock chat interface.
3. Phase 10: Build the student dashboard UI, README update, and verification.

This keeps the highest-risk demonstrable workflow, chat, ahead of dashboard polish while preserving the user-supplied development order.

