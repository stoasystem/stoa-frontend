# Phase 15: Streaming, Attachment, and Teacher Help Contracts - Context

**Gathered:** 2026-05-24
**Status:** Complete
**Mode:** Autonomous from v1.4 roadmap

## Phase Boundary

Extend frontend type contracts for streaming chat events, message statuses, attachments, uploaded files, and teacher-help status. Preserve the backend-only AI provider boundary.

## Implementation Notes

- Chat roles remain `student`, `assistant`, `teacher`, and `system`.
- Message statuses now cover `sending`, `streaming`, `completed`, `stopped`, and `failed`, while preserving existing `sent` compatibility.
- File and teacher-help contracts live in dedicated type modules.
