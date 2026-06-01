# Research: v2.2 Upload UI Stack

## Scope

Milestone v2.2 adds a reusable Photo & File Upload UI foundation to the existing React + TypeScript + Vite STOA frontend. It should upgrade existing Chat upload behavior and extend the same upload model into Question Bank and Practice Path without adding production storage, OCR, image recognition, or direct model-provider calls.

## Current Codebase Fit

Existing upload-related code:

- `src/components/chat/FileUploadButton.tsx` validates PNG, JPEG, and PDF and uploads through `useFileUploadMutation`.
- `src/components/chat/AttachmentPreview.tsx` displays current chat attachments.
- `src/services/files/fileApi.ts` posts `FormData` to `/files` and returns `UploadedFile` metadata.
- `src/types/file.ts` and `src/types/chat.ts` already define upload/chat attachment metadata.
- `src/hooks/chat/useStreamingChat.ts` already supports `attachmentIds` and optimistic `attachments`.

Implication: v2.2 should create a reusable upload feature layer around the existing file API and chat attachment conventions rather than duplicating per-page upload logic.

## Browser APIs

- Use standard `<input type="file">` for selection. MDN documents that file selection can come from a file input or drag and drop, and object URLs can preview local files before upload.
- Use `accept="image/*"` and `capture="environment"` for camera-first mobile photo capture. MDN notes `capture` works best on mobile and commonly falls back to a normal picker on desktop.
- Use drag-and-drop only as an enhancement. MDN's file drag-and-drop guidance still requires a defined drop zone and preventing default browser drag behavior.
- Use `URL.createObjectURL()` for local image preview and `URL.revokeObjectURL()` during cleanup to avoid leaking object URLs.

## Accessibility APIs

- Upload controls must be reachable as real buttons or labeled inputs.
- Upload status and errors should be exposed through `aria-live` or alert/status semantics.
- Upload modal should follow WAI-ARIA dialog focus rules: focus enters the dialog, tab stays inside, Escape closes, and focus returns to the opener.
- Drag-and-drop must not be the only path; browse buttons are required for keyboard and screen-reader users.

## Dependencies

No new runtime dependency is required for v2.2. Existing React, TypeScript, Vite, lucide-react icons, app UI primitives, TanStack Query, and service patterns are enough.

Recommended additions:

- `src/features/uploads/` for the reusable upload feature module.
- No heavyweight upload picker package; the scope is small and product-specific.
- No OCR, image cropper, antivirus, cloud storage SDK, or PDF renderer dependency in this milestone.

## Sources

- MDN file input and capture: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
- MDN capture attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
- MDN File API and object URLs: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
- MDN file drag and drop: https://mdn2.netlify.app/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
- WAI-ARIA modal dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
