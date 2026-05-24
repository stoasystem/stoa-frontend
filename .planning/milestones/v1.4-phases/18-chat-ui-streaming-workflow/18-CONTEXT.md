# Phase 18: Chat UI Streaming Workflow - Context

**Gathered:** 2026-05-24
**Status:** Complete
**Mode:** Autonomous from v1.4 roadmap

## Phase Boundary

Refactor `/chat` to use the streaming hook and expose stop, retry, new conversation, and attachment-aware sending.

## Implementation Notes

- `ChatPage` now composes canonical backend messages with local streaming messages.
- `ChatInput` owns pending attachments and sends `attachmentIds`.
- `ChatMessageBubble` displays roles, statuses, attachments, and retry for failed student messages.
