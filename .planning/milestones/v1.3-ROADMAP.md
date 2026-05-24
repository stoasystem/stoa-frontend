# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)

## Phases

<details>
<summary>✅ v1.0 Frontend Foundation (Phases 1-3) - SHIPPED 2026-05-24</summary>

### Phase 1: Vite Foundation App
**Goal**: Complete the standard Vite React TypeScript scaffold and replace placeholder/demo UI with a minimal STOA initialization page.
**Plans**: 2 plans complete

### Phase 2: Tooling Verification
**Goal**: Make local build, lint, preview, lockfile, and repository ignore rules reliable.
**Plans**: 2 plans complete

### Phase 3: Documentation and Repository Readiness
**Goal**: Document the foundation workflow and ensure the repository is ready for initial GitHub handoff.
**Plans**: 2 plans complete

</details>

<details>
<summary>✅ v1.1 Frontend Development Foundation (Phases 4-7) - SHIPPED 2026-05-24</summary>

### Phase 4: Styling and UI Foundation
**Goal**: Configure TailwindCSS, shadcn-style UI primitives, lucide icons, alias support, STOA theme tokens, and design notes.
**Requirements**: [STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06]
**Plans**: 2 plans complete

### Phase 5: App Providers, Router, Layouts, and Pages
**Goal**: Establish the app shell with providers, router, layouts, and placeholder routes.
**Requirements**: [ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05]
**Plans**: 2 plans complete

### Phase 6: Services, State, Types, Hooks, and Common Components
**Goal**: Add reusable API, state, type, hook, and common component foundations for future product work.
**Requirements**: [SVC-01, SVC-02, SVC-03, SVC-04, STATE-01, STATE-02, STATE-03, STATE-04, TYPE-01, TYPE-02, TYPE-03, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05]
**Plans**: 2 plans complete

### Phase 7: Acceptance Page, Documentation, and Verification
**Goal**: Prove the Phase 2 stack works through the Home acceptance page, README updates, command verification, and GitHub handoff.
**Requirements**: [COMP-06, DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05]
**Plans**: 2 plans complete

</details>

<details>
<summary>✅ v1.2 Core Product UI (Phases 8-10) - SHIPPED 2026-05-24</summary>

**Milestone Goal:** Build the first demonstrable STOA product interface with a mock-driven student chat experience and student dashboard on top of the Phase 2 frontend foundation.

- [x] **Phase 8: Product UI Types and Mock Data** - Define chat/dashboard contracts and mock data for the Phase 3 UI.
- [x] **Phase 9: Mock Chat Interface** - Build the `/chat` product UI with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
- [x] **Phase 10: Student Dashboard, Documentation, and Verification** - Build the `/dashboard` product UI, document Phase 3, and verify scripts/routes.

</details>

<details>
<summary>✅ v1.3 Phase 4 Backend Integration and Real Chat API (Phases 11-14) - SHIPPED 2026-05-24</summary>

**Milestone Goal:** Connect the Phase 3 chat UI to the real backend Chat API so conversations, messages, send-message, teacher-help requests, and local FastAPI/Codex-provider integration are driven through the unified STOA backend contract.

- [x] **Phase 11: Chat API Contract and Client** - Define chat API types and replace the old placeholder chat client with typed backend endpoint functions.
- [x] **Phase 12: Chat Query and Mutation Hooks** - Add TanStack Query keys, conversation queries, send-message mutation, and teacher-help mutation.
- [x] **Phase 13: Backend-Driven Chat Page and UI States** - Replace `useMockChat` on `/chat` with backend data flow, component prop updates, and user-visible loading/error/empty/pending feedback.
- [x] **Phase 14: Backend Integration Documentation and Verification** - Document local FastAPI/CORS/Codex-provider integration, update env examples, and verify build plus route behavior.

### Phase 11: Chat API Contract and Client

**Goal**: Define the Phase 4 chat API contract and centralize backend endpoint calls in the chat service layer.
**Depends on**: Phase 10
**Requirements**: [API-01, API-02, API-03, API-04]
**Success Criteria** (what must be TRUE):
  1. `src/types/chat.ts` includes all Phase 4 request/response and conversation summary/detail types.
  2. `src/services/chat/chatApi.ts` exposes typed functions for all required conversation and teacher-help endpoints.
  3. Chat endpoint functions use the shared Axios `httpClient`.
  4. Components do not import backend endpoint functions directly.
  5. The API layer is ready to absorb camelCase/snake_case mapping if backend naming differs.
**Plans**: 2 plans complete

Plans:
- [x] 11-01: Update chat API type contracts.
- [x] 11-02: Refactor chat service endpoint functions.

### Phase 12: Chat Query and Mutation Hooks

**Goal**: Add TanStack Query integration for conversation list/detail, send-message, and teacher-help flows.
**Depends on**: Phase 11
**Requirements**: [QRY-01, QRY-02, QRY-03, QRY-04, QRY-05, QRY-06]
**Success Criteria** (what must be TRUE):
  1. `chatQueryKeys` is the single source for chat query key construction.
  2. `useConversationsQuery` loads `GET /conversations`.
  3. `useConversationQuery` loads active conversation detail only when an ID exists.
  4. `useSendMessageMutation` posts content and invalidates active conversation and conversation list queries on success.
  5. `useTeacherHelpMutation` wraps the teacher-help request API.
  6. Chat hooks live under `src/hooks/chat/` and do not depend on mock data.
**Plans**: 2 plans complete

Plans:
- [x] 12-01: Add chat query keys and read hooks.
- [x] 12-02: Add send-message and teacher-help mutation hooks.

### Phase 13: Backend-Driven Chat Page and UI States

**Goal**: Switch `/chat` from mock state to backend-backed query/mutation state while preserving the Phase 3 UI experience.
**Depends on**: Phase 12
**Requirements**: [API-05, CHAT-13, CHAT-14, CHAT-15, CHAT-16, CHAT-17, CHAT-18, CHAT-19, CHAT-20, STATE-05, STATE-06, STATE-07, STATE-08, STATE-09, STATE-10, STATE-11, STATE-12, STATE-13]
**Success Criteria** (what must be TRUE):
  1. `ChatPage` no longer imports `useMockChat`.
  2. Conversation sidebar renders backend summaries and changes the active conversation ID.
  3. Active conversation messages render from backend detail data.
  4. Send-message pending disables input and shows assistant thinking.
  5. Successful send refreshes messages through query invalidation/refetch.
  6. Conversation list and detail loading/error/empty states are visible.
  7. Send-message and teacher-help operation failures show page-level or inline feedback.
  8. Teacher-help request action calls the backend mutation and exposes pending/success/error UI.
**Plans**: 3 plans complete

Plans:
- [x] 13-01: Update chat component props for backend data and disabled states.
- [x] 13-02: Refactor `ChatPage` to query/mutation data flow.
- [x] 13-03: Add chat loading, error, empty, and operation feedback states.

### Phase 14: Backend Integration Documentation and Verification

**Goal**: Document local backend integration and verify the Phase 4 frontend can build and run with the new chat data flow.
**Depends on**: Phase 13
**Requirements**: [DOCS-09, DOCS-10, DOCS-11, DOCS-12, DOCS-13, DOCS-14]
**Success Criteria** (what must be TRUE):
  1. `.env.example` includes `VITE_API_BASE_URL=http://localhost:8000`.
  2. README lists the expected Phase 4 backend endpoints.
  3. README documents frontend/backend/API docs local URLs.
  4. README documents FastAPI CORS requirements for `http://localhost:5173`.
  5. README states the frontend does not call model providers directly and Codex is backend-only during testing.
  6. README states Phase 4 uses normal HTTP responses, not streaming.
  7. `npm install`, `npm run build`, and relevant `/chat` route checks pass or any backend dependency limitation is recorded.
**Plans**: 2 plans complete

Plans:
- [x] 14-01: Update env example and README backend integration docs.
- [x] 14-02: Run build and chat route verification.

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vite Foundation App | v1.0 | 2/2 | Complete | 2026-05-24 |
| 2. Tooling Verification | v1.0 | 2/2 | Complete | 2026-05-24 |
| 3. Documentation and Repository Readiness | v1.0 | 2/2 | Complete | 2026-05-24 |
| 4. Styling and UI Foundation | v1.1 | 2/2 | Complete | 2026-05-24 |
| 5. App Providers, Router, Layouts, and Pages | v1.1 | 2/2 | Complete | 2026-05-24 |
| 6. Services, State, Types, Hooks, and Common Components | v1.1 | 2/2 | Complete | 2026-05-24 |
| 7. Acceptance Page, Documentation, and Verification | v1.1 | 2/2 | Complete | 2026-05-24 |
| 8. Product UI Types and Mock Data | v1.2 | 2/2 | Complete | 2026-05-24 |
| 9. Mock Chat Interface | v1.2 | 2/2 | Complete | 2026-05-24 |
| 10. Student Dashboard, Documentation, and Verification | v1.2 | 2/2 | Complete | 2026-05-24 |
| 11. Chat API Contract and Client | v1.3 | 2/2 | Complete | 2026-05-24 |
| 12. Chat Query and Mutation Hooks | v1.3 | 2/2 | Complete | 2026-05-24 |
| 13. Backend-Driven Chat Page and UI States | v1.3 | 3/3 | Complete | 2026-05-24 |
| 14. Backend Integration Documentation and Verification | v1.3 | 2/2 | Complete | 2026-05-24 |
