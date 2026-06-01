# Photo & File Upload UI Foundation

Milestone v2.2 adds a shared upload foundation for learning-context uploads. The goal is to let a student bring a photo or PDF from real schoolwork into STOA and ask the Learning Assistant for guided help.

## Product Boundary

This is not a file manager, scanner, OCR system, or automatic solver.

The UI supports:

- Photos and PDFs as learning materials.
- Chat composer uploads.
- Question Bank upload entry points.
- Question Session upload handoff.
- Practice Path schoolwork upload handoff.
- Preview, validation, upload, remove, retry, failed, and rejected states.
- Mobile photo capture and desktop drag/drop with Browse fallback.

The UI does not claim:

- OCR or image understanding.
- Handwriting or formula recognition.
- Automatic problem solving from images.
- Permanent storage.
- Encryption guarantees.
- Teacher grading, parent review, or admin moderation.

## Shared Module

The upload foundation lives under:

```text
src/features/uploads/
```

Key files:

- `types/uploads.ts` defines upload contexts, file kinds, statuses, attachment metadata, validation errors, and config.
- `utils/uploadValidation.ts` validates file type, size, empty files, and count limits.
- `utils/uploadLimits.ts` defines accepted formats and context-specific limits.
- `utils/uploadHandoff.ts` stores lightweight upload metadata for Chat handoff.
- `services/uploadService.ts` wraps existing file upload behavior and provides demo/mock fallback metadata.
- `hooks/useUploadAttachments.ts` manages attachment state, validation, preview URLs, remove, retry, and clearing.
- `components/*` provides shared upload buttons, photo capture, dropzone, preview cards, modal, inline panel, and error/status UI.

## Supported Formats and Limits

Supported formats:

- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

Default limit:

- 10 MB per file
- 5 files per generic upload
- 3 files per Chat message
- 2 files per Question Session help request

Office files and video files are intentionally deferred.

## Integration Points

### Learning Chat

`src/components/chat/ChatInput.tsx` now uses the shared upload hook and components. It supports attach file, take photo, preview, remove, retry, and sending attachments with the message.

If a student sends only an attachment, the UI uses a safe starter prompt asking the Learning Assistant to help understand the uploaded schoolwork step by step.

### Question Bank

`src/pages/question-bank/QuestionBankHomePage.tsx` adds a secondary Upload Question flow.

`src/pages/question-bank/QuestionSessionPage.tsx` adds a compact upload panel under the answer/feedback area so students can upload their own work for the current problem.

Both flows save lightweight upload metadata and route to `/chat` with source context.

### Practice Path

`src/pages/practice/PracticeOverviewPage.tsx` and `src/pages/practice/TopicRoadmapPage.tsx` add a compact schoolwork upload panel.

The panel is intentionally secondary so the guided Practice Path roadmap remains the main workflow.

## Accessibility

Upload UI requirements:

- File inputs are triggered by real buttons.
- Drag/drop always has a Browse files fallback.
- Errors use alert/live-region treatment.
- Status badges include text and icons, not color alone.
- Remove and retry actions include the file name in accessible labels.
- Image previews use alt text.
- Modal behavior relies on Radix Dialog focus management.

## Demo and Backend Handoff

The service can use the existing `/files` endpoint for Chat uploads. In demo/mock fallback mode, it creates local upload metadata so the UI remains testable without production storage.

Future backend work should replace the fallback with:

- signed upload URLs or backend-mediated upload endpoints
- retention policy
- malware scanning
- OCR/image analysis job state
- parent/tutor/admin privacy rules

Those are explicitly outside v2.2.

## Verification

Run:

```bash
npm run lint
npm run build
npm run test:e2e -- uploads.spec.ts
```

Manual smoke paths:

- `/chat`: start a conversation, attach a photo/PDF, remove, retry failed upload, send with attachment.
- `/question-bank`: open Upload Question, upload a file, ask the Learning Assistant.
- `/question-bank/session/session-linear-equations-basics`: upload from the session help area and hand off to Chat.
- `/practice`: upload schoolwork and hand off to Chat.
- `/practice/mathematics/equations`: confirm the upload panel remains secondary to the roadmap.
