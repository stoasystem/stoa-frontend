# Milestones

## v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow (Implemented: 2026-05-24)

**Phases completed:** 6 phases, 6 plans, 0 tasks
**Audit:** `.planning/milestones/v1.4-MILESTONE-AUDIT.md`

### Delivered

- Streaming chat event types and fetch-based streaming client for `POST /conversations/:conversationId/messages/stream`.
- Local streaming chat hook with optimistic student messages, assistant placeholders, chunk appending, stop generation, failed state, retry metadata, and query invalidation.
- File upload service and mutation for `POST /files`.
- PNG/JPEG/PDF upload UI with 10 MB and 3-attachment client-side limits.
- Attachment previews and attachment-aware chat sends.
- `/chat` upgraded to use streaming send flow, stop generation, retry failed user messages, and queued first-message sends after new conversation creation.
- Teacher-help request/status service and stateful teacher-help status card.
- README Phase 5 documentation for endpoints, upload limits, and backend-only model provider strategy.

### Verification

- Requirements: 37/37 implemented.
- Phases: 6/6 implemented.
- Build: passed.
- Lint: passed.
- Local `/chat` HTTP route: passed with Vite dev server returning 200.
- Browser visual check: attempted, but the Browser plugin reported the in-app browser was unavailable in this session.

---

## v1.3 Phase 4 Backend Integration and Real Chat API (Shipped: 2026-05-24)

**Phases completed:** 4 phases, 9 plans, 0 tasks
**Audit:** `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

### Delivered

- Typed Phase 4 chat API contract for conversations, messages, conversation creation, and teacher-help requests.
- Chat API service functions for `/conversations`, `/conversations/:conversationId`, `/conversations/:conversationId/messages`, and `/teacher-help/request`.
- TanStack Query chat keys plus conversation, create-conversation, send-message, and teacher-help hooks.
- `/chat` switched from `useMockChat` to backend query/mutation data flow.
- Loading, error, empty, pending, send-failure, teacher-help success/error, and first-conversation states.
- README Phase 4 backend integration documentation, including FastAPI CORS and backend-only Codex testing-provider strategy.

### Verification

- Requirements: 34/34 complete.
- Phases: 4/4 complete.
- Build: passed.
- Lint: passed.
- Browser route check with local mock backend: passed for list, detail, send-message, and teacher-help.
- Browser route check without backend: passed with visible error state.

---

## v1.2 Core Product UI - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

### Delivered

- Product UI contracts for chat and student dashboard data.
- Mock conversation and dashboard data under `src/data/`.
- `/chat` product UI with conversation sidebar, active message list, student/assistant bubbles, chat input, upload placeholder, AI thinking state, delayed mock response, and teacher-help placeholder.
- `/dashboard` product UI with student stats, recent questions, weak topics, learning progress, and teacher feedback.
- README Phase 3 Core Product UI documentation.
- Browser verification for `/chat` and `/dashboard`.

### Verification

- Requirements: 27/27 complete.
- Phases: 3/3 complete.
- Build: passed.
- Lint: passed.
- Browser dev route checks: passed.

## v1.0 Frontend Foundation - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/v1.0-MILESTONE-AUDIT.md`

### Delivered

- Runnable React + TypeScript + Vite foundation.
- Minimal STOA initialization page.
- Standard scaffold files, TypeScript configs, Vite HTML entry, CSS entry, and npm lockfile.
- Working `npm install`, `npm run dev`, `npm run build`, `npm run lint`, and `npm run preview` workflows.
- README handoff for local development.
- GitHub remote readiness for `https://github.com/stoasystem/stoa-frontend.git`.

### Verification

- Requirements: 18/18 complete.
- Phases: 3/3 complete.
- Build: passed.
- Lint: passed.
- Browser dev check: passed.
- Browser preview check: passed.

## v1.1 Frontend Development Foundation - Complete

**Completed:** 2026-05-24
**Audit:** `.planning/v1.1-MILESTONE-AUDIT.md`

### Delivered

- TailwindCSS Vite integration and STOA theme entry.
- shadcn-style UI primitives for the first component batch.
- React Router app routes for `/`, `/chat`, `/dashboard`, `/login`, and not-found.
- TanStack Query provider setup.
- Marketing, app, dashboard, and auth layouts.
- Axios HTTP client, API types, and chat API placeholder.
- Zustand auth/UI stores, auth hooks, shared user/chat/API types.
- Common components for logo, page shell, loading, error, and empty states.
- `.env.example`, README Phase 2 documentation, and design notes.
- Phase 2 acceptance page using Tailwind, UI primitives, router links, icons, layout, and aliases.

### Verification

- Requirements: 38/38 complete.
- Phases: 4/4 complete.
- Build: passed.
- Lint: passed.
- Browser dev route checks: passed.
- Browser preview check: passed.
