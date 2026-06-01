# Research: v2.2 Upload UI Pitfalls

## Product Pitfalls

### Overpromising Recognition

Camera-solver products often promise that the app can solve from the picture. v2.2 must not claim OCR, handwriting recognition, formula recognition, or automatic solving. Copy should say the student can upload learning material and ask the Learning Assistant.

Prevention: require copy review and internal-term/overpromise scan in the final QA phase.

### Upload Becoming a File Center

If upload UI becomes a generic file manager, it will dilute STOA's learning flow. Upload should remain context-bound: Chat turn, current Question Bank question, or Practice schoolwork help.

Prevention: model `UploadContext`, avoid a visible global upload library, and keep `/uploads/demo` internal only.

### Duplicate Upload Implementations

The repo already has Chat upload code. Adding separate Question Bank and Practice upload logic would create inconsistent validation, preview, and error states.

Prevention: build shared `src/features/uploads/` components and migrate Chat to them.

## UX Pitfalls

### Drag-and-Drop Only

Desktop drop zones are useful, but drag-and-drop is inaccessible if it lacks a browse button and keyboard flow.

Prevention: every drop zone includes Browse files; modal and inline panels are keyboard reachable.

### Hidden Status Changes

Upload progress and errors can be visually obvious but inaccessible to screen readers.

Prevention: use `aria-live`/status/alert treatment for validation, upload, failure, and retry messages.

### Mobile Camera Assumptions

`capture="environment"` is a hint, not a guaranteed camera UI. Desktop and some browsers will fall back to file selection.

Prevention: label the control as "Take photo" in student-facing copy but treat selected files generically in code.

### Attachment Preview Memory Leaks

Object URLs for previews can leak if never revoked.

Prevention: centralize preview URL management and revoke URLs on removal/unmount.

## Technical Pitfalls

### Storing Raw Files Globally

Raw `File` objects should not be placed in global state or long-lived route state.

Prevention: keep raw files inside upload hook/service flow and pass only `UploadAttachment` metadata across routes.

### Unsupported Large Fixtures

Oversized upload E2E tests can bloat the repo if committed as binary files.

Prevention: generate oversized files dynamically in Playwright tests.

### Backend Boundary Drift

Using a mock service may accidentally imply production storage or security guarantees.

Prevention: UI copy must avoid permanent-storage and encryption claims; docs should state v2.2 is UI/demo flow only.

## Phase Coverage

- Shared module phase: prevents duplication and File/object URL mistakes.
- Component phase: prevents inaccessible controls and weak state display.
- Chat integration phase: prevents regression in existing attachment path.
- Question Bank/Practice integration phase: prevents upload from becoming detached from learning context.
- QA/localization phase: catches overpromise copy, mobile fit, keyboard flow, and core upload E2E.

## Sources

- WAI-ARIA dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN File API object URL guidance: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications
- MDN capture attribute guidance: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
- Khanmigo safety/privacy guidance: https://support.khanacademy.org/hc/en-us/articles/36868912022541-What-kind-of-images-can-I-upload-to-Khanmigo
