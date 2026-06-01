# Research: v2.2 Upload UI Feature Patterns

## Comparable Product Patterns

### Khanmigo

Khanmigo's image upload flow is directly relevant because it is learning-assistant chat for math/science. The pattern:

- Upload lives inside the tutoring conversation.
- Paperclip opens image options including file, URL, or camera.
- The student must include a message/question; image-only submission is not allowed.
- Supported image types are narrow: PNG and JPEG.
- Guidance tells students to upload clear learning-relevant images and avoid sensitive/personal content.
- Uploaded image thumbnails can be opened for a larger view.
- Privacy is explicit: images are session-scoped and not retained after the chat session.

STOA implication: require or strongly encourage prompt text with attachment context in Chat, show thumbnail/file cards, keep copy focused on "help me understand this", and avoid claiming the system can solve from the image during v2.2.

### ChatGPT

ChatGPT presents upload as part of the composer tools menu: "Add photos or files" rather than as a separate file-management destination. It supports many formats, but the key design pattern is composer-native attachment selection and keeping uploaded files attached to the conversation turn.

STOA implication: Chat upload should live in the composer and show attachment cards before send; Question Bank and Practice should route uploaded learning material into Chat rather than creating a separate file center.

### Google Classroom

Google Classroom uses assignment/task context rather than generic storage. Students attach existing files, photos, and created materials to a specific work item. Mobile flows commonly expose photo capture and file upload; desktop flows emphasize attach/upload.

STOA implication: every upload should carry a learning context (`chat`, `question_bank`, `question_session`, `practice_path`) so the next action is task-specific: ask the Learning Assistant, attach to this question, or continue Practice.

### Photomath and Camera-Solver Products

Camera-solver products emphasize fast camera capture for a math problem, but they often promise recognition or solving. That is intentionally outside v2.2. STOA can learn the entry-point priority: camera-first on mobile and immediate preview, but must not copy the "instant solve" positioning.

STOA implication: use "Upload a photo or PDF and ask the Learning Assistant" rather than "solve any problem instantly".

## Table Stakes

- File input and camera capture entry points.
- Drag-and-drop on desktop plus Browse fallback.
- Preview cards for images and file cards for PDFs.
- File type, size, and count validation before upload.
- Clear states: validating, uploading, uploaded, failed, rejected.
- Remove and retry controls per attachment.
- Reusable modal for page-level uploads.
- Reusable inline panel for contextual learning pages.
- Chat composer integration with attachment preview before send.
- Context handoff to Learning Chat from Question Bank and Practice.
- Localized copy across existing app languages.
- Accessible error/status announcements and keyboard operation.

## Differentiators for STOA

- Treat uploads as "bring real schoolwork into the learning flow", not generic file management.
- Keep the Learning Assistant as the next step after upload.
- Use restrained, premium STOA visual language instead of camera-solver hype.
- Preserve the boundary between Question Bank open practice, Practice Path guided lessons, and Chat explanation.
- Avoid unsafe promises about OCR, recognition, solving, permanent storage, or security guarantees.

## Anti-Features for v2.2

- OCR or image understanding.
- Cropping and handwriting recognition.
- Teacher grading workflows.
- Parent file review.
- Admin upload moderation backend.
- Office document preview.
- Permanent file library.
- "Instant answer" or "perfect solution" marketing copy.

## Sources

- Khanmigo image upload support: https://support.khanacademy.org/hc/en-us/articles/36868912022541-What-kind-of-images-can-I-upload-to-Khanmigo
- OpenAI Academy, ChatGPT files: https://openai.com/academy/working-with-files/
- Google Classroom Android assignment attachment help: https://support.google.com/edu/classroom/answer/6020265
- Photomath camera problem flow: https://support.google.com/photomath/answer/14333327
