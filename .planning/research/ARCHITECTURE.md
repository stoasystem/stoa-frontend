# Project Research: Architecture for v1.4 Phase 5

**Milestone:** v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow
**Date:** 2026-05-24

## Existing Architecture

The app is a React SPA using Vite, React Router, TanStack Query, Axios service modules, local UI components, and route-level pages. v1.3 changed `/chat` from mock data to backend-driven conversation list/detail and send-message flows.

## Recommended Phase 5 Architecture

### Server State

TanStack Query remains the source for:

- Conversation list.
- Conversation detail.
- Create conversation mutation.
- File upload mutation result.
- Teacher-help request and status.

After streaming completes, the frontend invalidates conversation detail and list queries so backend canonical messages replace local temporary messages.

### Local State

React component/hook state owns:

- Streaming user-message optimistic state.
- Assistant streaming placeholder and chunk content.
- Current `AbortController`.
- Pending attachments before send.
- Input-level validation and upload errors.

This avoids high-frequency global store updates while keeping the canonical state flow simple.

### Services

- `chatApi.ts`: normal JSON conversation operations already present.
- `chatStreamApi.ts`: fetch streaming POST client and SSE-style parser.
- `fileApi.ts`: multipart upload and optional status lookup.
- `teacherHelpApi.ts`: create request and retrieve status.

### Component Flow

`ChatPage` should compose:

- `ConversationSidebar` plus `NewConversationButton`.
- `ChatMessageList` fed with canonical messages merged with local streaming messages.
- `ChatInput` with file upload, attachment previews, send, disabled, and stop states.
- `TeacherEscalationCard` or `TeacherHelpStatusCard` with stateful request display.

### Data Merge Strategy

During active streaming:

1. Render backend conversation messages.
2. Append local optimistic user message.
3. Append local assistant placeholder/streaming message.
4. On completion, invalidate queries and clear local temporary messages when refreshed data arrives.

On failure:

1. Preserve failed local user message.
2. Display retry action.
3. Retry resends the same content and attachment IDs.

## Build Order

1. Types and services.
2. Streaming hook.
3. File upload hook and UI.
4. Conversation creation hook/button.
5. Message/input component upgrades.
6. Teacher help status UI.
7. ChatPage composition and verification.
