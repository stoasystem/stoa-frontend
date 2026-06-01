# Research Summary: v2.2 Photo & File Upload UI Foundation

## Stack Additions

No new dependency is recommended. Browser file input, capture, drag/drop, object URLs, existing React state/hooks, existing file API service patterns, and current UI primitives are sufficient.

Build a reusable feature module:

```text
src/features/uploads/
```

This should wrap existing `src/services/files/fileApi.ts` and replace the Chat-only upload controls with shared upload components.

## Feature Table Stakes

- Attachment selection through button/file input.
- Photo capture entry using `accept="image/*"` and `capture="environment"`.
- Desktop drag-and-drop with Browse fallback.
- Image thumbnails and PDF/file cards.
- Validation for type, size, empty files, and count limits.
- States for validating, uploading, uploaded, failed, rejected, and removed.
- Remove and retry per file.
- Chat composer preview and send-with-attachment support.
- Question Bank upload CTA and Question Session upload help area.
- Practice Path schoolwork upload panel.
- Learning Assistant handoff with upload context.
- Four-language uploads namespace.
- Keyboard, screen-reader, and modal focus behavior.
- Playwright coverage for happy path, rejection, and keyboard modal smoke.

## Design Comparison Takeaways

- Khanmigo is the closest pattern: upload inside tutor chat, camera option, narrow image support, require a question with the image, and clear privacy/safety guidance.
- ChatGPT reinforces composer-native attachment flow: files belong to a conversation turn, not a separate file center.
- Google Classroom reinforces task-bound attachments: file/photo upload is attached to a learning assignment or task.
- Photomath/camera-solver products show why mobile camera entry matters, but STOA should avoid their "instant solve" promise.

## STOA Design Direction

Use the existing STOA design system: calm, premium, education-centered, and low-pressure. The memorable product idea is "bring the real worksheet into the learning conversation." The UI should feel like a small learning action, not a storage or scanner product.

Recommended user-facing copy direction:

- "Upload a photo or PDF and ask the Learning Assistant."
- "Please upload learning materials only. Do not upload personal documents."
- "I can help with the question you uploaded. Tell me what part is unclear."

Avoid:

- "Instantly solve any problem."
- "We read your image."
- "Securely stored forever."
- "OCR complete."

## Architecture Guidance

- Keep raw `File` objects local to upload hooks/components.
- Store and route only upload metadata.
- Add a session-storage fallback for upload-to-Chat handoff.
- Continue using backend/file API boundaries; frontend must not call storage providers directly.
- Keep `/uploads/demo` internal and unlinked from main navigation.

## Watch Out For

- Duplicating upload logic across Chat, Question Bank, and Practice.
- Drag-and-drop without keyboard Browse fallback.
- Status/error states that are visual only.
- Unrevoked object URLs.
- Copy that implies OCR, solving, permanent storage, or security guarantees.
- Large binary test fixtures.

## Sources

- Khanmigo image uploads: https://support.khanacademy.org/hc/en-us/articles/36868912022541-What-kind-of-images-can-I-upload-to-Khanmigo
- ChatGPT files in conversations: https://openai.com/academy/working-with-files/
- Google Classroom attachments: https://support.google.com/edu/classroom/answer/6020265
- Photomath camera problem flow: https://support.google.com/photomath/answer/14333327
- MDN file input: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
- MDN capture: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
- MDN File API: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
- MDN file drag and drop: https://mdn2.netlify.app/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
- WAI-ARIA modal dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
