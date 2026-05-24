# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- ✅ **v1.1 Frontend Development Foundation** - Phases 4-7 (shipped 2026-05-24)
- 🚧 **v1.2 Core Product UI** - Phases 8-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Frontend Foundation (Phases 1-3) - SHIPPED 2026-05-24</summary>

### Phase 1: Vite Foundation App
**Goal**: Complete the standard Vite React TypeScript scaffold and replace placeholder/demo UI with a minimal STOA initialization page.
**Plans**: 2 plans

Plans:
- [x] 01-01: Add missing Vite scaffold files and normalize app entry points.
- [x] 01-02: Replace placeholder route surface with the minimal STOA foundation page.

### Phase 2: Tooling Verification
**Goal**: Make local build, lint, preview, lockfile, and repository ignore rules reliable.
**Plans**: 2 plans

Plans:
- [x] 02-01: Add or fix TypeScript, ESLint, and package tooling configuration.
- [x] 02-02: Run verification commands and address failures.

### Phase 3: Documentation and Repository Readiness
**Goal**: Document the foundation workflow and ensure the repository is ready for initial GitHub handoff.
**Plans**: 2 plans

Plans:
- [x] 03-01: Rewrite README for the Phase 1 foundation handoff.
- [x] 03-02: Verify repository hygiene and document GitHub readiness.

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

### 🚧 v1.2 Core Product UI (In Progress)

**Milestone Goal:** Build the first demonstrable STOA product interface with a mock-driven student chat experience and student dashboard on top of the Phase 2 frontend foundation.

- [ ] **Phase 8: Product UI Types and Mock Data** - Define chat/dashboard contracts and mock data for the Phase 3 UI.
- [ ] **Phase 9: Mock Chat Interface** - Build the `/chat` product UI with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
- [ ] **Phase 10: Student Dashboard, Documentation, and Verification** - Build the `/dashboard` product UI, document Phase 3, and verify scripts/routes.

### Phase 8: Product UI Types and Mock Data
**Goal**: Define the chat and dashboard data contracts plus mock data that will drive the Phase 3 product UI.
**Depends on**: Phase 7
**Requirements**: [TYPE-04, TYPE-05, DATA-01, DATA-02]
**Success Criteria** (what must be TRUE):
  1. `src/types/chat.ts` defines the Phase 3 chat message and conversation contracts.
  2. `src/types/dashboard.ts` defines dashboard stats, weak topics, recent questions, teacher feedback, and learning progress contracts.
  3. `src/data/mockConversations.ts` contains at least two conversations with student and assistant messages.
  4. `src/data/mockDashboard.ts` contains stats, weak topics, recent questions, learning progress, and teacher feedback.
  5. Mock data is separated from presentational components.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Add chat and dashboard type contracts.
- [ ] 08-02: Add mock conversation and dashboard data.

### Phase 9: Mock Chat Interface
**Goal**: Build the `/chat` product UI with mock conversations, message sending, AI thinking state, upload placeholder, and teacher-help placeholder.
**Depends on**: Phase 8
**Requirements**: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10, CHAT-11, CHAT-12]
**Success Criteria** (what must be TRUE):
  1. `/chat` renders a full chat workspace rather than a placeholder.
  2. Desktop users can see and select mock conversations from a sidebar.
  3. The active conversation message history updates when a conversation is selected.
  4. Sending a message appends the student message, shows an AI thinking state, and then appends a mock assistant response.
  5. Upload and request-teacher placeholders are visible.
  6. Small screens remain usable without serious horizontal overflow.
**Plans**: 2 plans

Plans:
- [ ] 09-01: Build chat components and `useMockChat`.
- [ ] 09-02: Assemble `ChatPage` and verify chat interactions.

### Phase 10: Student Dashboard, Documentation, and Verification
**Goal**: Build the `/dashboard` product UI, document Phase 3, and verify scripts/routes.
**Depends on**: Phase 9
**Requirements**: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DOCS-06, DOCS-07, DOCS-08]
**Success Criteria** (what must be TRUE):
  1. `/dashboard` renders a student learning overview rather than a placeholder.
  2. Dashboard stat, recent question, weak topic, learning progress, and teacher feedback modules render from mock data.
  3. Dashboard layouts use responsive grids that collapse cleanly on smaller screens.
  4. README documents Phase 3 Core Product UI, included routes, included modules, and mock-data-only scope.
  5. `npm install`, `npm run build`, and route checks for `/chat` and `/dashboard` pass.
  6. Phase 3 work is committed with clear Core Product UI history.
**Plans**: 2 plans

Plans:
- [ ] 10-01: Build dashboard components and assemble `StudentDashboardPage`.
- [ ] 10-02: Update README, run verification, and prepare commit handoff.

## Progress

**Execution Order:**
Phases execute in numeric order: 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vite Foundation App | v1.0 | 2/2 | Complete | 2026-05-24 |
| 2. Tooling Verification | v1.0 | 2/2 | Complete | 2026-05-24 |
| 3. Documentation and Repository Readiness | v1.0 | 2/2 | Complete | 2026-05-24 |
| 4. Styling and UI Foundation | v1.1 | 2/2 | Complete | 2026-05-24 |
| 5. App Providers, Router, Layouts, and Pages | v1.1 | 2/2 | Complete | 2026-05-24 |
| 6. Services, State, Types, Hooks, and Common Components | v1.1 | 2/2 | Complete | 2026-05-24 |
| 7. Acceptance Page, Documentation, and Verification | v1.1 | 2/2 | Complete | 2026-05-24 |
| 8. Product UI Types and Mock Data | v1.2 | 0/2 | Pending | — |
| 9. Mock Chat Interface | v1.2 | 0/2 | Pending | — |
| 10. Student Dashboard, Documentation, and Verification | v1.2 | 0/2 | Pending | — |

