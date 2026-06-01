# Requirements: STOA Frontend v2.2

## v2.2 Requirements

### Upload Foundation

- [ ] **UPF-01**: Developers can use a shared `src/features/uploads/` module for upload types, utilities, services, hooks, and components instead of page-specific upload implementations.
- [ ] **UPF-02**: Upload metadata distinguishes upload context, file kind, status, validation errors, source page, and source entity without storing raw `File` objects in global app state.
- [ ] **UPF-03**: Upload validation supports accepted file types, empty files, maximum file size, and maximum file count with reusable error objects.
- [ ] **UPF-04**: Upload utilities classify JPG, PNG, WEBP, and PDF files and format file sizes consistently.
- [ ] **UPF-05**: Upload preview helpers create image preview object URLs and revoke them when attachments are removed or components unmount.
- [ ] **UPF-06**: Upload service functions can upload, retry, and remove attachments through a mock/demo-ready boundary that can later delegate to production file APIs.

### Shared Upload UI

- [ ] **UPUI-01**: Students can choose files through a reusable upload button that supports accepted types, multiple selection, disabled state, and accessible labeling.
- [ ] **UPUI-02**: Students can use a dedicated photo capture entry that uses mobile camera capture when available and falls back to image file selection.
- [ ] **UPUI-03**: Desktop students can drag and drop files into a visible drop zone, and keyboard users can use an equivalent Browse files action.
- [ ] **UPUI-04**: Students can see attachment preview cards for image thumbnails, PDFs, and unknown file types with filename, type, size, status, and actions.
- [ ] **UPUI-05**: Students can remove an attachment from a preview list before sending or handing it off.
- [ ] **UPUI-06**: Students can retry failed uploads from the attachment card.
- [ ] **UPUI-07**: Students can see clear status labels for validating, uploading, uploaded, failed, and rejected attachments without relying on color alone.
- [ ] **UPUI-08**: Students can see clear upload error messages for unsupported type, too-large file, too-many files, empty file, upload failure, and unavailable preview.
- [ ] **UPUI-09**: Students can open a reusable upload modal from contextual pages and complete upload actions without losing the page context.
- [ ] **UPUI-10**: Students can use a reusable inline upload panel on learning pages without it visually overtaking the primary learning flow.

### Chat Integration

- [ ] **UPCHAT-01**: Students can attach supported photos and PDFs from the Learning Chat composer.
- [ ] **UPCHAT-02**: Students can take or select a photo from the Chat composer on mobile-capable browsers.
- [ ] **UPCHAT-03**: Students can preview, remove, and retry Chat attachments before sending a message.
- [ ] **UPCHAT-04**: Students can send a Chat message with uploaded attachment metadata and the message stream displays the attachment cards.
- [ ] **UPCHAT-05**: Chat upload behavior preserves existing streaming, stop generation, retry message, attachment IDs, and teacher-help behavior.
- [ ] **UPCHAT-06**: Chat copy encourages students to include a question or prompt with an upload and does not imply image recognition or automatic solving.

### Question Bank Integration

- [ ] **UPQB-01**: Students can open an Upload Question flow from the Question Bank home page as a secondary CTA.
- [ ] **UPQB-02**: Students can upload a photo or PDF from the Question Bank home upload flow and see preview, validation, remove, retry, and completion states.
- [ ] **UPQB-03**: Students can ask the Learning Assistant from a completed Question Bank upload, with upload context passed to Chat.
- [ ] **UPQB-04**: Students can access upload help from a Question Bank session question without disrupting answer input or feedback controls.
- [ ] **UPQB-05**: Students can upload a photo or PDF for the current question and then ask the Learning Assistant with session ID, question ID, and attachment metadata.
- [ ] **UPQB-06**: Question Bank upload copy stays distinct from Practice Path and avoids exam-system or instant-solver positioning.

### Practice Path Integration

- [ ] **UPPRAC-01**: Students can see a lightweight schoolwork upload entry on Practice Path surfaces without displacing the guided roadmap or lesson CTA.
- [ ] **UPPRAC-02**: Students can upload a photo or PDF from Practice and see preview, validation, remove, retry, and completion states.
- [ ] **UPPRAC-03**: Students can ask the Learning Assistant from a completed Practice upload with Practice source context.
- [ ] **UPPRAC-04**: Practice upload copy frames the flow as bringing schoolwork into step-by-step guidance, not as a generic file upload or game reward.

### Handoff, Privacy, and Product Boundaries

- [ ] **UPCTX-01**: Upload-to-Chat handoff supports route state and a session-storage fallback using lightweight attachment metadata.
- [ ] **UPCTX-02**: Chat can render a context card or starter message for upload handoffs from Question Bank and Practice.
- [ ] **UPCTX-03**: Upload UI includes a lightweight privacy reminder asking students to upload learning materials only and not personal documents.
- [ ] **UPCTX-04**: User-facing upload copy does not claim OCR, handwriting recognition, formula recognition, image understanding, automatic solving, permanent storage, encryption, teacher grading, parent review, or admin moderation.
- [ ] **UPCTX-05**: Upload docs identify future extension points for OCR/image analysis, teacher help, parent reporting, and production storage without implementing them in v2.2.

### Localization, Accessibility, and QA

- [ ] **UPQA-01**: English, German, French, and Italian `uploads` localization files cover upload actions, statuses, errors, previews, dropzone copy, privacy copy, and learning-context copy.
- [ ] **UPQA-02**: Upload controls are keyboard reachable and use real buttons or labeled file inputs.
- [ ] **UPQA-03**: Upload errors and status changes are announced through accessible alert/status/live-region behavior.
- [ ] **UPQA-04**: Upload modal focus enters the modal, remains in the modal while open, closes through a visible control, and returns focus to the opener.
- [ ] **UPQA-05**: Attachment remove and retry buttons include the filename in their accessible label.
- [ ] **UPQA-06**: Image previews include meaningful alt text and non-image attachments have clear file-kind labels.
- [ ] **UPQA-07**: Upload panels, modal, dropzone, preview cards, and Chat composer remain usable at mobile and desktop widths in all four supported languages.
- [ ] **UPQA-08**: Playwright coverage verifies Chat attachment preview/remove/send, unsupported type rejection, too-large rejection, Question Bank upload modal, Question Session upload handoff, and keyboard modal flow.
- [ ] **UPQA-09**: `npm run lint` passes after upload implementation.
- [ ] **UPQA-10**: `npm run build` passes after upload implementation.

## Future Requirements

| Requirement | Reason Deferred |
|-------------|-----------------|
| Production object storage and signed upload URLs | v2.2 validates frontend upload UX and service contracts before backend storage architecture. |
| OCR, image understanding, handwriting recognition, and formula recognition | These require AI/backend design and are outside the UI foundation. |
| Automatic problem solving from an image | STOA should first establish safe upload and Learning Assistant handoff without unsupported solving claims. |
| Crop, rotate, markup, and scan-cleanup tools | Valuable later, but not required for the first reusable upload foundation. |
| Office document preview for DOCX/PPTX/XLSX | v2.2 focuses on common learning materials: photos and PDFs. |
| Teacher grading or annotation of uploaded files | Teacher workflows require separate product scope and backend contracts. |
| Parent review of uploaded files | Parent file review and retention need privacy/product decisions beyond this milestone. |
| Admin file moderation dashboard | Moderation workflow is future operational scope. |
| Video upload or live teacher file sharing | Heavy media support is outside the lightweight learning-material upload flow. |
| Permanent file library or folder management | v2.2 uploads are context-bound learning aids, not a storage product. |

## Out of Scope

| Item | Reason |
|------|--------|
| Real S3, object storage SDKs, or direct browser-to-storage provider calls | Frontend must stay behind STOA backend/API boundaries. |
| Real virus scanning or security certification claims | Requires backend/security infrastructure and policy work. |
| Claims that STOA has read, parsed, recognized, or solved uploaded content | v2.2 does not implement OCR or image understanding. |
| User-visible model/provider/debug terminology | Learning Assistant remains the product-facing term. |
| Main-navigation upload center | Upload should remain contextual to learning flows. |
| Broad redesign of Chat, Question Bank, or Practice | v2.2 adds upload affordances while preserving existing product hierarchy. |
| New paid gating or upload entitlement logic | Existing plan usage surfaces may remain, but v2.2 is not a billing milestone. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPF-01 | 206 | Pending |
| UPF-02 | 206 | Pending |
| UPF-03 | 206 | Pending |
| UPF-04 | 206 | Pending |
| UPF-05 | 206 | Pending |
| UPF-06 | 206 | Pending |
| UPUI-01 | 207 | Pending |
| UPUI-02 | 207 | Pending |
| UPUI-03 | 207 | Pending |
| UPUI-04 | 207 | Pending |
| UPUI-05 | 207 | Pending |
| UPUI-06 | 207 | Pending |
| UPUI-07 | 207 | Pending |
| UPUI-08 | 207 | Pending |
| UPUI-09 | 207 | Pending |
| UPUI-10 | 207 | Pending |
| UPCHAT-01 | 208 | Pending |
| UPCHAT-02 | 208 | Pending |
| UPCHAT-03 | 208 | Pending |
| UPCHAT-04 | 208 | Pending |
| UPCHAT-05 | 208 | Pending |
| UPCHAT-06 | 208 | Pending |
| UPQB-01 | 209 | Pending |
| UPQB-02 | 209 | Pending |
| UPQB-03 | 209 | Pending |
| UPQB-04 | 209 | Pending |
| UPQB-05 | 209 | Pending |
| UPQB-06 | 209 | Pending |
| UPPRAC-01 | 210 | Pending |
| UPPRAC-02 | 210 | Pending |
| UPPRAC-03 | 210 | Pending |
| UPPRAC-04 | 210 | Pending |
| UPCTX-01 | 209 | Pending |
| UPCTX-02 | 209 | Pending |
| UPCTX-03 | 211 | Pending |
| UPCTX-04 | 211 | Pending |
| UPCTX-05 | 211 | Pending |
| UPQA-01 | 211 | Pending |
| UPQA-02 | 207 | Pending |
| UPQA-03 | 207 | Pending |
| UPQA-04 | 207 | Pending |
| UPQA-05 | 207 | Pending |
| UPQA-06 | 207 | Pending |
| UPQA-07 | 211 | Pending |
| UPQA-08 | 211 | Pending |
| UPQA-09 | 211 | Pending |
| UPQA-10 | 211 | Pending |

**Total requirements:** 47
**Mapped requirements:** 47
**Unmapped requirements:** 0

*Last updated: 2026-06-02 after v2.2 requirements definition*
