# Requirements: STOA Frontend v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow

**Defined:** 2026-05-24
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA student chat workflow backed only by the unified STOA backend API contract.

## v1.4 Requirements

Requirements for the fifth-stage streaming chat, file upload, and real learning workflow milestone. Each maps to roadmap phases.

### Streaming Chat

- [x] **STREAM-01**: User can send a chat message through `POST /conversations/:conversationId/messages/stream`.
- [x] **STREAM-02**: User message appears immediately as an optimistic local message after submit.
- [x] **STREAM-03**: Assistant streaming placeholder appears immediately after stream start.
- [x] **STREAM-04**: `message_delta` events append progressively to the assistant message.
- [x] **STREAM-05**: `message_done` marks the assistant message as completed.
- [x] **STREAM-06**: `message_error` or stream startup failure marks the relevant message as failed.
- [x] **STREAM-07**: Completed streaming invalidates canonical conversation queries.

### Message Actions

- [x] **MSG-01**: User can stop an in-progress assistant generation.
- [x] **MSG-02**: Stopped assistant messages show `stopped` status.
- [x] **MSG-03**: User can retry failed user-message sends with original content and attachment IDs.
- [x] **MSG-04**: Chat message types distinguish student, assistant, teacher, and system messages.
- [x] **MSG-05**: Message bubbles display sending, streaming, completed, stopped, and failed states.

### Conversation Flow

- [x] **CONV-01**: User can create a new conversation from `/chat`.
- [x] **CONV-02**: Successful conversation creation refreshes the conversation list.
- [x] **CONV-03**: Newly created conversation is automatically selected.
- [x] **CONV-04**: User can send the first message in a newly created conversation.

### File Upload

- [x] **FILE-01**: User can upload PNG homework files.
- [x] **FILE-02**: User can upload JPEG homework files.
- [x] **FILE-03**: User can upload PDF homework files.
- [x] **FILE-04**: Unsupported file types are blocked before upload.
- [x] **FILE-05**: Files over 10 MB are blocked before upload.
- [x] **FILE-06**: More than 3 pending attachments are blocked before upload.
- [x] **FILE-07**: Uploading, uploaded, and failed file states are visible.
- [x] **FILE-08**: Uploaded attachment previews show filename, type, size/status, and remove action.
- [x] **FILE-09**: Sending a chat message includes uploaded `attachmentIds`.
- [x] **FILE-10**: File upload service calls `POST /files` with `multipart/form-data`.

### Teacher Help

- [x] **TEACH-01**: User can request teacher help for the active conversation.
- [x] **TEACH-02**: Teacher-help request pending state is visible.
- [x] **TEACH-03**: Teacher-help assigned state is visible.
- [x] **TEACH-04**: Teacher-help in-progress state is visible.
- [x] **TEACH-05**: Teacher-help resolved state is visible.
- [x] **TEACH-06**: Teacher-help request failures show a visible error state.
- [x] **TEACH-07**: Teacher-help service supports status lookup through `GET /teacher-help/request/:requestId`.

### Documentation and Verification

- [x] **DOCS-15**: README documents Phase 5 streaming chat and file upload behavior.
- [x] **DOCS-16**: README lists expected Phase 5 backend endpoints.
- [x] **DOCS-17**: README states the frontend still does not call model-provider APIs directly.
- [x] **DOCS-18**: Local verification covers build, lint, `/chat`, streaming, upload, and teacher-help states.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Authentication and Roles

- **AUTH-01**: User can register, log in, and persist sessions through real auth integration.
- **ROLE-01**: Student, parent, tutor, and admin roles have protected route access.
- **PARENT-01**: Parent dashboard can view student learning history.
- **TUTOR-01**: Tutor or teacher dashboard can handle escalated sessions.

### Advanced AI Workflow

- **STREAM-08**: User can retry failed or partial assistant responses.
- **STREAM-09**: Backend generation can be cancelled through a dedicated cancel endpoint.
- **FILE-11**: User can see async OCR/PDF parsing progress beyond uploaded metadata.
- **MEMORY-01**: User can manage long-term learning memory.

### Other Product Areas

- **DASHAPI-01**: Dashboard loads student overview data from `GET /students/me/dashboard`.
- **PAY-01**: Payment and subscription flows exist.
- **DEPLOY-01**: Production deployment workflow exists.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Direct frontend model API calls | The frontend must remain decoupled from OpenAI, Claude, Gemini, DeepSeek, Codex, and other providers. |
| Frontend `STOA_AI_PROVIDER` config | AI provider selection is backend-only. |
| WebSocket chat | Phase 5 only needs backend streaming response over fetch/SSE-style events. |
| Dedicated backend cancel endpoint | Frontend abort is sufficient for Phase 5; backend cancellation can be added later. |
| AI partial-response retry | Basic failed user-message retry is the Phase 5 requirement. |
| Full OCR/PDF parsing UI | Phase 5 displays upload metadata and supports future parsing statuses. |
| Live multi-person teacher chat | Phase 5 displays teacher-help request status only. |
| Full auth enforcement | Authorization belongs to the next auth/roles milestone. |
| Parent dashboard API | Phase 5 focuses on chat workflow. |
| Tutor/teacher dashboard API | Teacher help is limited to request/status endpoints. |
| Production deployment | Local integration and build verification only. |
| Payment system | Deferred until product and auth flows mature. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STREAM-01 | Phase 16 | Complete |
| STREAM-02 | Phase 16 | Complete |
| STREAM-03 | Phase 16 | Complete |
| STREAM-04 | Phase 16 | Complete |
| STREAM-05 | Phase 16 | Complete |
| STREAM-06 | Phase 16 | Complete |
| STREAM-07 | Phase 16 | Complete |
| MSG-01 | Phase 18 | Complete |
| MSG-02 | Phase 18 | Complete |
| MSG-03 | Phase 18 | Complete |
| MSG-04 | Phase 15 | Complete |
| MSG-05 | Phase 18 | Complete |
| CONV-01 | Phase 18 | Complete |
| CONV-02 | Phase 18 | Complete |
| CONV-03 | Phase 18 | Complete |
| CONV-04 | Phase 18 | Complete |
| FILE-01 | Phase 17 | Complete |
| FILE-02 | Phase 17 | Complete |
| FILE-03 | Phase 17 | Complete |
| FILE-04 | Phase 17 | Complete |
| FILE-05 | Phase 17 | Complete |
| FILE-06 | Phase 17 | Complete |
| FILE-07 | Phase 17 | Complete |
| FILE-08 | Phase 17 | Complete |
| FILE-09 | Phase 18 | Complete |
| FILE-10 | Phase 17 | Complete |
| TEACH-01 | Phase 19 | Complete |
| TEACH-02 | Phase 19 | Complete |
| TEACH-03 | Phase 19 | Complete |
| TEACH-04 | Phase 19 | Complete |
| TEACH-05 | Phase 19 | Complete |
| TEACH-06 | Phase 19 | Complete |
| TEACH-07 | Phase 19 | Complete |
| DOCS-15 | Phase 20 | Complete |
| DOCS-16 | Phase 20 | Complete |
| DOCS-17 | Phase 20 | Complete |
| DOCS-18 | Phase 20 | Complete |

**Coverage:**
- v1.4 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after v1.4 initialization*
