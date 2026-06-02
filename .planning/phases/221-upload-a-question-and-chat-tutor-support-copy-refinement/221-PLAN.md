# Phase 221 Plan: Upload a Question and Chat Tutor Support Copy

## Scope

Make upload and Chat escalation trustworthy without implying OCR, automatic solving, or an AI teacher.

## Tasks

1. Normalize upload labels: Upload a Question, Take Photo, Attach File, Ask Learning Assistant.
2. Keep upload modal and inline panels explicit about supported formats, size, privacy, and attached files.
3. Rename teacher support states to tutor support states in Chat.
4. Use Start Live Classroom for escalation from tutor support.
5. Update E2E assertions for the refined copy.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:e2e -- uploads.spec.ts student-chat.spec.ts live-classroom.spec.ts v2.4-ui-refinement.spec.ts`
