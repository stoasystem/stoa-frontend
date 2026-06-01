# Phase 208 Plan: Learning Chat Upload Composer Integration

## Goal

Move Chat upload behavior onto the shared upload foundation while preserving existing message send, streaming, retry, and teacher-help behavior.

## Scope

- Replace page-specific composer attachment controls with shared upload controls.
- Preview, remove, and retry attachments before send.
- Pass uploaded attachment IDs and metadata into `onSendMessage`.
- Render sent attachment cards consistently in the conversation.
- Support upload-only messages through a safe default prompt.

## Acceptance

- Chat supports photos and PDFs through shared upload components.
- Send is blocked during active upload.
- Existing Chat behavior continues to work with attachments.
