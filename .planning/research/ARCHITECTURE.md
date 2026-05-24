# Research: Architecture for v1.3 Backend Chat Integration

**Date:** 2026-05-24
**Milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

## Current Architecture

- `src/pages/chat/ChatPage.tsx` assembles chat UI.
- `src/hooks/useMockChat.ts` owns mock active conversation state and local delayed replies.
- `src/data/mockConversations.ts` drives the chat page.
- `src/components/chat/*` are props-driven and reusable.
- `src/services/api/httpClient.ts` centralizes Axios configuration.

## Target Architecture

Data flow:

1. `ChatPage` owns only `activeConversationId` local state.
2. `useConversationsQuery` reads conversation summaries.
3. `useConversationQuery` reads active conversation messages.
4. `useSendMessageMutation` sends message content and invalidates list/detail queries.
5. `useTeacherHelpMutation` sends teacher-help requests.
6. Presentational components continue receiving typed props.
7. Backend provider details remain behind the backend Chat API.

## Integration Points

- `src/types/chat.ts`: extend contract to include list response, send/create/request payloads, and teacher-help response.
- `src/services/chat/chatApi.ts`: replace old `/chat` placeholder with conversation endpoint functions.
- `src/services/chat/chatQueryKeys.ts`: centralize cache keys.
- `src/hooks/chat/*`: add query/mutation wrappers.
- `src/pages/chat/ChatPage.tsx`: swap `useMockChat` for query/mutation hooks.
- `src/components/chat/ChatInput.tsx`: accept disabled state.
- `src/components/chat/TeacherEscalationCard.tsx`: accept action and pending state.
- `src/components/chat/ConversationSidebar.tsx` and `ConversationListItem.tsx`: accept `ConversationSummary[]`.
- `README.md` and `.env.example`: document backend integration.

## Suggested Build Order

1. Types and API client contract.
2. Query keys and hooks.
3. Component prop compatibility.
4. ChatPage data-flow replacement and states.
5. README/env documentation and verification.
