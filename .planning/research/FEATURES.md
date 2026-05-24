# Project Research: Features for v1.4 Phase 5

**Milestone:** v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow
**Date:** 2026-05-24

## Table Stakes

### Streaming Chat

- User message appears immediately after submit.
- Assistant placeholder appears immediately after streaming starts.
- Assistant content updates chunk-by-chunk.
- Completed stream marks assistant message complete.
- Stream startup or mid-stream error marks the relevant message failed.
- Input controls reflect streaming state and expose a stop action.

### Abort Generation

- Each active stream has one `AbortController`.
- Stop calls `abort()` and marks the current assistant message `stopped`.
- Future backend cancellation endpoint can be added without changing UI concepts.

### Retry

- At least failed user-message send retry is supported.
- Retry reuses the original content and attachment IDs.
- AI partial-response retry can be deferred because it needs clearer backend semantics.

### Conversation Creation

- User can create a new conversation from the sidebar or empty state.
- Successful creation refreshes the conversation list.
- The new conversation becomes selected.
- First message can be sent immediately after creation.

### File Upload

- User can select PNG, JPEG, and PDF files.
- Unsupported file types are blocked before upload.
- Files over 10 MB are blocked before upload.
- At most 3 pending attachments are allowed.
- Uploading, success, and failure states are visible.
- Successful upload returns attachment metadata.
- Pending attachments are previewed and can be removed before send.
- Sending a message includes `attachmentIds`.

### Teacher Help

- User can request teacher help from the active conversation.
- Teacher request state displays `pending`.
- Status UI supports `assigned`, `in_progress`, and `resolved`.
- Request failures display a retryable or visible error state.

## Differentiators For Later

- Token-level typing animation separate from network chunks.
- Retry AI partial response from a failed assistant message.
- Backend cancellation endpoint.
- Async file parsing progress polling beyond uploaded metadata.
- Live teacher chat or teacher queue view.
- User-level attachment library or learning history.

## Dependencies On Existing Work

- v1.3 already provides conversation list/detail queries and normal send-message service.
- Phase 5 should preserve existing components where possible and extend props rather than replace the chat page wholesale.
- Canonical conversation data remains backend-owned; local streaming data is temporary.

## Acceptance-Oriented Feature Groups

- Streaming protocol and types.
- Streaming hook and message state.
- Conversation creation flow.
- Upload service and attachment UI.
- Teacher-help status workflow.
- Documentation and verification.
