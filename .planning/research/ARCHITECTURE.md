# Research: v2.2 Upload UI Architecture

## Architecture Direction

Use a reusable feature module:

```text
src/features/uploads/
  components/
  hooks/
  services/
  types/
  utils/
```

This keeps upload behavior consistent across Chat, Question Bank, and Practice while allowing current service boundaries to remain backend-agnostic.

## Existing Integration Points

### Chat

Current files:

- `src/components/chat/ChatInput.tsx`
- `src/components/chat/FileUploadButton.tsx`
- `src/components/chat/AttachmentPreview.tsx`
- `src/components/chat/ChatMessageBubble.tsx`
- `src/hooks/chat/useStreamingChat.ts`
- `src/services/files/fileApi.ts`
- `src/types/chat.ts`
- `src/types/file.ts`

Recommended approach:

- Replace per-chat validation and preview components with reusable upload components.
- Preserve `attachmentIds` and message attachment metadata in `useStreamingChat`.
- Add a photo capture button and multi-attachment preview list in the composer.
- Keep existing file API integration when API mode supports uploads, with a mock/demo fallback for page-level upload flows.

### Question Bank

Current files:

- `src/pages/question-bank/QuestionBankHomePage.tsx`
- `src/pages/question-bank/QuestionSessionPage.tsx`
- `src/components/question-bank/QuestionFeedbackPanel.tsx`
- `src/components/question-bank/QuestionBankContextCard.tsx`

Recommended approach:

- Add an inline "Have your own question?" panel on the Question Bank home page.
- Add a "Need help with this question?" upload area inside the session help/feedback area.
- Use upload state plus route state/session storage to pass attachments into `/chat?source=question-bank-upload` or `/chat?source=question-bank&questionId=...`.

### Practice

Current files:

- `src/pages/practice/PracticeOverviewPage.tsx`
- `src/pages/practice/TopicRoadmapPage.tsx`
- `src/pages/practice/LessonPage.tsx`
- `src/components/practice/PracticeOverview.tsx`
- `src/components/practice/PracticeToChatCTA.tsx`

Recommended approach:

- Add a lightweight schoolwork upload panel near existing Practice entry/help areas.
- Do not make upload the dominant Practice CTA.
- Handoff to Chat with practice context and attachment metadata.

## Data Model

Define upload-specific metadata independent of raw `File`:

- `UploadContext`
- `UploadFileKind`
- `UploadStatus`
- `UploadAttachment`
- `UploadValidationError`
- `UploadConfig`

Do not keep raw `File` objects in global stores. Keep `File` only in component/hook scope until upload simulation/API upload returns metadata.

## Service Strategy

Create `uploadService.ts` with:

- `uploadFiles(files, context, options)`
- `retryUpload(attachment)`
- `removeUploadedAttachment(attachmentId)`

The service can delegate to existing `/files` API for Chat or simulate mock uploads for UI flows. For v2.2, the critical contract is returned metadata and state handling, not production storage.

## Handoff Strategy

Use a small bridge:

- Route query identifies source: `source=question-bank-upload`, `source=question-session-upload`, or `source=practice-upload`.
- Route state carries lightweight `UploadAttachment[]` metadata.
- Session storage key `stoa.pendingLearningAssistantUpload` can backstop reloads or route-state loss.

## QA Demo Route

An internal `/uploads/demo` route is useful but should not appear in main navigation. It should exercise:

- Upload button
- Photo capture
- Dropzone
- Preview list
- Rejected state
- Failed/retry state
- Keyboard/modal flow

## Sources

- Current repository scan on 2026-06-02.
- Khanmigo and ChatGPT composer upload patterns from research sources listed in `FEATURES.md`.
- MDN and WAI-ARIA implementation guidance listed in `STACK.md`.
