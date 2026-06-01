# Phase 208 UI Spec

## Interaction Contract

- The composer exposes attach and photo actions next to the existing message input.
- Attachments appear above the composer action row with stable card sizing.
- The send button remains disabled while uploads are in progress.
- Upload-only sends use a learning-help prompt so the assistant has conversational context.

## Preservation Contract

Streaming, stop generation, failed-message retry, teacher-help status, and existing chat lock behavior remain unchanged.
