# Requirements: STOA Frontend v1.2 Core Product UI

**Defined:** 2026-05-24
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and see a credible STOA product prototype that demonstrates the core student AI learning flow with mock data.

## v1.2 Requirements

Requirements for the third-stage core product UI milestone. Each maps to roadmap phases.

### Product Contracts

- [ ] **TYPE-04**: Chat types define `ChatRole`, `ChatMessageStatus`, `ChatMessage`, and `Conversation` with subject, grade, timestamps, conversation IDs, and message status.
- [ ] **TYPE-05**: Dashboard types define dashboard stats, weak topics, recent questions, teacher feedback, and learning progress data contracts.
- [ ] **DATA-01**: Mock conversations exist under `src/data/` and include multiple conversations with student and assistant messages.
- [ ] **DATA-02**: Mock dashboard data exists under `src/data/` and includes stats, weak topics, recent questions, learning progress, and teacher feedback.

### Chat UI

- [ ] **CHAT-01**: User can open `/chat` and see a full chat workspace instead of a placeholder page.
- [ ] **CHAT-02**: User can see a desktop conversation sidebar with existing mock conversations.
- [ ] **CHAT-03**: User can click different conversations and see the active message history update.
- [ ] **CHAT-04**: User can distinguish student and assistant messages through message bubble alignment and styling.
- [ ] **CHAT-05**: User can type a question in the chat input and send it with a button.
- [ ] **CHAT-06**: User sees their sent message appear immediately in the active conversation.
- [ ] **CHAT-07**: User sees an AI thinking/loading state after sending a message.
- [ ] **CHAT-08**: User receives a delayed mock assistant response after the loading state.
- [ ] **CHAT-09**: User can see a file upload entry point placeholder.
- [ ] **CHAT-10**: User can see a request-teacher entry point placeholder.
- [ ] **CHAT-11**: Chat UI remains usable on small screens by preventing message/input overflow and hiding the desktop sidebar.
- [ ] **CHAT-12**: Mock chat state is isolated in `useMockChat` and can later be replaced by API-backed query/mutation hooks.

### Student Dashboard

- [ ] **DASH-01**: User can open `/dashboard` and see a student learning overview instead of a placeholder page.
- [ ] **DASH-02**: User can see dashboard stat cards for questions asked, teacher help sessions, and learning streak.
- [ ] **DASH-03**: User can see recent questions with subject and answer status.
- [ ] **DASH-04**: User can see weak topics with subject and level.
- [ ] **DASH-05**: User can see a learning progress module.
- [ ] **DASH-06**: User can see teacher feedback.
- [ ] **DASH-07**: Dashboard UI uses responsive grids that collapse to one column on small screens.
- [ ] **DASH-08**: Dashboard modules receive data through props so future API integration does not require rewriting presentational components.

### Documentation and Verification

- [ ] **DOCS-06**: README documents Phase 3 Core Product UI, included routes, included UI modules, and mock-data-only scope.
- [ ] **DOCS-07**: `npm install`, `npm run dev`, `npm run build`, and relevant route checks for `/chat` and `/dashboard` pass.
- [ ] **DOCS-08**: Phase 3 work is committed with a clear Core Product UI commit history.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Backend Integration

- **API-01**: Chat UI loads conversations from `GET /conversations`.
- **API-02**: Chat UI loads a selected conversation from `GET /conversations/:conversationId`.
- **API-03**: Chat UI sends messages through `POST /conversations/:conversationId/messages`.
- **API-04**: User can create a conversation through `POST /conversations`.
- **API-05**: User can request teacher help through `POST /teacher-help/request`.
- **API-06**: Dashboard loads student overview data from `GET /students/me/dashboard`.
- **STREAM-01**: AI chat supports streaming responses.
- **UPLOAD-01**: User can upload files for AI-supported learning.
- **AUTH-01**: User can register, log in, and persist sessions through real auth integration.
- **PAY-01**: Payment and subscription flows exist.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real AI API integration | Phase 3 proves the UI flow with mock data before backend contracts are wired. |
| Real streaming response | Requires API contract and streaming technical design in a later phase. |
| Real file upload | Phase 3 only exposes an upload affordance. |
| Real login/auth enforcement | Existing auth scaffolding remains, but Phase 3 is not an auth milestone. |
| Real teacher routing | Phase 3 only exposes the request-teacher placeholder. |
| Parent dashboard | Student product UI is the only dashboard scope for this milestone. |
| Tutor/teacher dashboard | Teacher escalation UI is placeholder-only. |
| Payment | Explicitly excluded from this product UI milestone. |
| Production deployment | Not part of this milestone. |
| Mobile conversation drawer | Baseline responsive behavior is enough; drawer UX can be added later. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-04 | Phase 8 | Pending |
| TYPE-05 | Phase 8 | Pending |
| DATA-01 | Phase 8 | Pending |
| DATA-02 | Phase 8 | Pending |
| CHAT-01 | Phase 9 | Pending |
| CHAT-02 | Phase 9 | Pending |
| CHAT-03 | Phase 9 | Pending |
| CHAT-04 | Phase 9 | Pending |
| CHAT-05 | Phase 9 | Pending |
| CHAT-06 | Phase 9 | Pending |
| CHAT-07 | Phase 9 | Pending |
| CHAT-08 | Phase 9 | Pending |
| CHAT-09 | Phase 9 | Pending |
| CHAT-10 | Phase 9 | Pending |
| CHAT-11 | Phase 9 | Pending |
| CHAT-12 | Phase 9 | Pending |
| DASH-01 | Phase 10 | Pending |
| DASH-02 | Phase 10 | Pending |
| DASH-03 | Phase 10 | Pending |
| DASH-04 | Phase 10 | Pending |
| DASH-05 | Phase 10 | Pending |
| DASH-06 | Phase 10 | Pending |
| DASH-07 | Phase 10 | Pending |
| DASH-08 | Phase 10 | Pending |
| DOCS-06 | Phase 10 | Pending |
| DOCS-07 | Phase 10 | Pending |
| DOCS-08 | Phase 10 | Pending |

**Coverage:**
- v1.2 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after v1.2 initialization*
