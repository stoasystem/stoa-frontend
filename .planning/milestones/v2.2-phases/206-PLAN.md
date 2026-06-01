# Phase 206 Plan: Upload Domain Model, Validation, and Service Foundation

## Goal

Create a reusable upload feature module that keeps file validation, preview lifecycle, typed metadata, and mock/API-ready service behavior out of page-specific code.

## Scope

- Add `src/features/uploads/types`, `utils`, `services`, and `hooks`.
- Support upload contexts for Chat, Question Bank, Question Session, and Practice.
- Validate JPG, PNG, WEBP, PDF, empty files, 10 MB maximum size, and context-specific count limits.
- Keep raw `File` objects inside component/hook state only; route/session handoff uses lightweight metadata.
- Provide upload, retry, and remove service functions with a future backend delegation boundary.

## Acceptance

- Upload metadata includes context, source, file kind, status, preview, uploaded URL, and validation errors.
- Preview object URLs are centralized and revocable.
- Validation behavior is shared across later UI integrations.
