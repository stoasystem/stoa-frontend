# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- ✅ **v1.2 Core Product UI** - Phases 8-10 (shipped 2026-05-24)
- ✅ **v1.3 Phase 4 Backend Integration and Real Chat API** - Phases 11-14 (shipped 2026-05-24)
- ✅ **v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow** - Phases 15-20 (implemented 2026-05-24)
- 🔄 **v1.5 Phase 6 Authentication, User Roles, and Parent Visibility** - Phases 21-27 (planned 2026-05-24)

## Phases

<details>
<summary>✅ v1.0 Frontend Foundation (Phases 1-3) - SHIPPED 2026-05-24</summary>

- [x] **Phase 1: Vite Foundation App** - Complete the standard Vite React TypeScript scaffold and replace placeholder/demo UI with a minimal STOA initialization page.
- [x] **Phase 2: Tooling Verification** - Make local build, lint, preview, lockfile, and repository ignore rules reliable.
- [x] **Phase 3: Documentation and Repository Readiness** - Document the foundation workflow and ensure the repository is ready for initial GitHub handoff.

</details>

<details>
<summary>✅ v1.1 Frontend Development Foundation (Phases 4-7) - SHIPPED 2026-05-24</summary>

- [x] **Phase 4: Styling and UI Foundation** - Configure TailwindCSS, shadcn-style UI primitives, lucide icons, alias support, STOA theme tokens, and design notes.
- [x] **Phase 5: App Providers, Router, Layouts, and Pages** - Establish the app shell with providers, router, layouts, and placeholder routes.
- [x] **Phase 6: Services, State, Types, Hooks, and Common Components** - Add reusable API, state, type, hook, and common component foundations for future product work.
- [x] **Phase 7: Acceptance Page, Documentation, and Verification** - Prove the Phase 2 stack works through the Home acceptance page, README updates, command verification, and GitHub handoff.

</details>

<details>
<summary>✅ v1.2 Core Product UI (Phases 8-10) - SHIPPED 2026-05-24</summary>

- [x] **Phase 8: Product UI Types and Mock Data** - Define chat/dashboard contracts and mock data for the Phase 3 UI.
- [x] **Phase 9: Mock Chat Interface** - Build the `/chat` product UI with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
- [x] **Phase 10: Student Dashboard, Documentation, and Verification** - Build the `/dashboard` product UI, document Phase 3, and verify scripts/routes.

</details>

<details>
<summary>✅ v1.3 Phase 4 Backend Integration and Real Chat API (Phases 11-14) - SHIPPED 2026-05-24</summary>

- [x] **Phase 11: Chat API Contract and Client** - Define chat API types and replace the old placeholder chat client with typed backend endpoint functions.
- [x] **Phase 12: Chat Query and Mutation Hooks** - Add TanStack Query keys, conversation queries, send-message mutation, and teacher-help mutation.
- [x] **Phase 13: Backend-Driven Chat Page and UI States** - Replace `useMockChat` on `/chat` with backend data flow, component prop updates, and user-visible loading/error/empty/pending feedback.
- [x] **Phase 14: Backend Integration Documentation and Verification** - Document local FastAPI/CORS/Codex-provider integration, update env examples, and verify build plus route behavior.

</details>

<details>
<summary>✅ v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow (Phases 15-20) - IMPLEMENTED 2026-05-24</summary>

- [x] **Phase 15: Streaming, Attachment, and Teacher Help Contracts** - Extend types and service contracts for streaming events, chat attachments, file uploads, and teacher-help status.
- [x] **Phase 16: Streaming Chat Client and Hook** - Add fetch-based streaming response handling, optimistic local messages, stop generation, failed states, retry metadata, and canonical query invalidation.
- [x] **Phase 17: File Upload Workflow** - Add PNG/JPEG/PDF upload service, mutation hook, validation, upload states, and attachment previews.
- [x] **Phase 18: Chat UI Streaming Workflow** - Upgrade `/chat`, message bubbles, message list, input, new conversation flow, stop, retry, and attachment-aware sending.
- [x] **Phase 19: Teacher Help Status Workflow** - Add teacher-help status service, query path, and stateful teacher escalation UI.
- [x] **Phase 20: Phase 5 Documentation and Verification** - Document endpoints and backend-only AI provider strategy, then verify build, lint, and route behavior.

</details>

<details open>
<summary>🔄 v1.5 Phase 6 Authentication, User Roles, and Parent Visibility (Phases 21-27) - PLANNED 2026-05-24</summary>

**Milestone Goal:** Upgrade STOA from a single-user learning prototype into an education platform with real user identity, role-specific access, parent visibility, tutor help-request handling, and a SQLite-backed local test backend.

- [ ] **Phase 21: Authentication Contracts, Store, and Route Guards** - Add role/user types, auth API client, token persistence, auth hooks, 401/403 handling, protected routes, role routes, and login/register/error pages.
- [ ] **Phase 22: SQLite-Backed Local Test Backend** - Add a local FastAPI + SQLite backend with auth, schema, seed data, permission filtering, and Phase 6 API contracts.
- [ ] **Phase 23: Student Profile, History, and Chat Scoping** - Add student profile/history services, hooks, pages, and current-user chat scoping.
- [ ] **Phase 24: Parent Dashboard and Child Visibility** - Add parent children, child summary, child history services/hooks/pages/components with parent-child permission boundaries.
- [ ] **Phase 25: Tutor Help Request Workflow** - Add tutor help-request list/detail/status services, hooks, pages, and status controls.
- [ ] **Phase 26: Role-Aware App Layout and Navigation** - Add role-aware layout navigation, user menu, role badge, admin placeholder, and consistent authenticated app shell.
- [ ] **Phase 27: Phase 6 Documentation and Verification** - Document Phase 6 auth, roles, local SQLite backend, seed accounts, and verify build plus role/API flows.

### Phase 21: Authentication Contracts, Store, and Route Guards

**Goal**: Establish the frontend authentication foundation and role-aware route boundary.
**Depends on**: Phase 20
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, ROLE-01, ROLE-02, ROLE-03, ROLE-04]
**Success Criteria** (what must be TRUE):
  1. User, role, and auth response types exist and are reused by auth store and API clients.
  2. Auth service supports login, register, and current-user endpoints.
  3. Auth store persists and clears `stoa_access_token`.
  4. HTTP client injects bearer token and handles 401/403 as specified.
  5. ProtectedRoute and RoleRoute guard protected and role-specific routes.
  6. Login, register, unauthorized, forbidden, and forgot-password placeholder routes render.
**Plans**: 0 plans complete

### Phase 22: SQLite-Backed Local Test Backend

**Goal**: Provide a local FastAPI + SQLite backend that exercises Phase 6 contracts and data permission boundaries.
**Depends on**: Phase 21
**Requirements**: [BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06, BACK-07]
**Success Criteria** (what must be TRUE):
  1. `backend/app` exposes a FastAPI application with auth, student, parent, tutor, conversation, file, and health routes.
  2. SQLite schema covers users, student profiles, parent-child links, conversations, messages, uploaded files, message attachments, teacher help requests, and learning history.
  3. Seed script creates student, parent, tutor, admin, profile, child relationship, conversations, messages, help requests, and history data.
  4. Passwords are hashed and login issues bearer tokens.
  5. Protected APIs return 401 when missing/invalid token.
  6. Role-mismatched APIs return 403.
  7. Student, parent, and tutor data reads are filtered by current user and role.
**Plans**: 0 plans complete

### Phase 23: Student Profile, History, and Chat Scoping

**Goal**: Add student profile and learning-history workflow while preserving current-user chat scoping.
**Depends on**: Phase 21, Phase 22
**Requirements**: [STUD-01, STUD-02, STUD-03, STUD-04]
**Success Criteria** (what must be TRUE):
  1. Student profile service, query hook, update mutation, and query keys exist.
  2. Student profile page displays and saves grade, school system, and primary subjects.
  3. Student learning-history page displays current user's history items.
  4. Student routes include `/dashboard`, `/chat`, `/profile`, and `/learning-history`.
  5. Conversation queries send authenticated requests and display only backend-authorized current-user data.
**Plans**: 0 plans complete

### Phase 24: Parent Dashboard and Child Visibility

**Goal**: Add parent dashboard and child summary/history visibility through parent-scoped APIs.
**Depends on**: Phase 22, Phase 23
**Requirements**: [PARN-01, PARN-02, PARN-03, PARN-04, PARN-05, PARN-06]
**Success Criteria** (what must be TRUE):
  1. Parent service and hooks load children, child summary, and child learning history.
  2. Parent dashboard lists bound children and handles empty/error/loading states.
  3. Child summary page displays child identity, stats, weak topics, recent questions, and teacher-help records.
  4. Child learning-history page displays summary-only history items.
  5. Parent UI does not expose controls to send messages as the child.
  6. Parent routes are role-protected under `/parent`.
**Plans**: 0 plans complete

### Phase 25: Tutor Help Request Workflow

**Goal**: Add tutor dashboard and help-request detail/status workflow.
**Depends on**: Phase 22
**Requirements**: [TUTR-01, TUTR-02, TUTR-03, TUTR-04]
**Success Criteria** (what must be TRUE):
  1. Tutor service and hooks load request list and detail.
  2. Tutor dashboard groups or distinguishes requests by status.
  3. Tutor request detail shows student, subject, grade, status, and necessary message context.
  4. Tutor can update request status to allowed values.
  5. Tutor routes are role-protected under `/tutor`.
**Plans**: 0 plans complete

### Phase 26: Role-Aware App Layout and Navigation

**Goal**: Make authenticated navigation and user identity consistent across roles.
**Depends on**: Phase 21, Phase 23, Phase 24, Phase 25
**Requirements**: [ROLE-05]
**Success Criteria** (what must be TRUE):
  1. App layout renders role-specific navigation for student, parent, tutor, and admin.
  2. User menu displays current user's name, role, and logout action.
  3. Role badge component displays role consistently.
  4. Admin dashboard placeholder is reachable only by admin.
  5. Navigation avoids links that the current role cannot use.
**Plans**: 0 plans complete

### Phase 27: Phase 6 Documentation and Verification

**Goal**: Document Phase 6 integration expectations and verify local auth, role, and SQLite-backed workflows.
**Depends on**: Phase 21, Phase 22, Phase 23, Phase 24, Phase 25, Phase 26
**Requirements**: [DOCS-19, VERF-01, VERF-02]
**Success Criteria** (what must be TRUE):
  1. README documents Phase 6 auth, roles, routes, endpoints, token storage, SQLite, local backend, and seed accounts.
  2. README states SQLite is backend-internal and local-test-only.
  3. `npm install`, `npm run dev`, and `npm run build` pass or limitations are recorded.
  4. Student, parent, tutor, and admin login flows are verified.
  5. Protected route and role route behavior is verified.
  6. SQLite-backed API flows for conversations, messages, parent summary, tutor help requests, and learning history are verified.
**Plans**: 0 plans complete

</details>

## Progress

**Execution Order:**
Phases execute in numeric order: 21 -> 22 -> 23 -> 24 -> 25 -> 26 -> 27

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
| 15. Streaming, Attachment, and Teacher Help Contracts | v1.4 | 1/1 | Complete | 2026-05-24 |
| 16. Streaming Chat Client and Hook | v1.4 | 1/1 | Complete | 2026-05-24 |
| 17. File Upload Workflow | v1.4 | 1/1 | Complete | 2026-05-24 |
| 18. Chat UI Streaming Workflow | v1.4 | 1/1 | Complete | 2026-05-24 |
| 19. Teacher Help Status Workflow | v1.4 | 1/1 | Complete | 2026-05-24 |
| 20. Phase 5 Documentation and Verification | v1.4 | 1/1 | Complete | 2026-05-24 |
| 21. Authentication Contracts, Store, and Route Guards | v1.5 | 0/0 | Not Started | — |
| 22. SQLite-Backed Local Test Backend | v1.5 | 0/0 | Not Started | — |
| 23. Student Profile, History, and Chat Scoping | v1.5 | 0/0 | Not Started | — |
| 24. Parent Dashboard and Child Visibility | v1.5 | 0/0 | Not Started | — |
| 25. Tutor Help Request Workflow | v1.5 | 0/0 | Not Started | — |
| 26. Role-Aware App Layout and Navigation | v1.5 | 0/0 | Not Started | — |
| 27. Phase 6 Documentation and Verification | v1.5 | 0/0 | Not Started | — |
