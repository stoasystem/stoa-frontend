# Roadmap: STOA Frontend

## Milestones

- ✅ **v1.0 Frontend Foundation** - Phases 1-3 (shipped 2026-05-24)
- 🚧 **v1.1 Frontend Development Foundation** - Phases 4-7 (in progress)

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

### 🚧 v1.1 Frontend Development Foundation (In Progress)

**Milestone Goal:** Turn the Phase 1 Vite foundation into a formal STOA frontend development base with styling, routing, providers, API layer, state stores, layouts, placeholder pages, theme entry, and documentation.

- [x] **Phase 4: Styling and UI Foundation** - Configure TailwindCSS, shadcn-style UI primitives, lucide icons, alias support, STOA theme tokens, and design notes.
- [x] **Phase 5: App Providers, Router, Layouts, and Pages** - Establish the app shell with providers, router, layouts, and placeholder routes.
- [x] **Phase 6: Services, State, Types, Hooks, and Common Components** - Add reusable API, state, type, hook, and common component foundations for future product work.
- [x] **Phase 7: Acceptance Page, Documentation, and Verification** - Prove the Phase 2 stack works through the Home acceptance page, README updates, command verification, and GitHub handoff.

### Phase 4: Styling and UI Foundation
**Goal**: Configure TailwindCSS, shadcn-style UI primitives, lucide icons, alias support, STOA theme tokens, and design notes.
**Depends on**: Phase 3
**Requirements**: [STYLE-01, STYLE-02, STYLE-03, STYLE-04, STYLE-05, STYLE-06]
**Success Criteria** (what must be TRUE):
  1. Developer can use Tailwind utility classes in pages and components.
  2. Vite and TypeScript resolve `@/*` imports.
  3. shadcn-style UI primitives exist under `src/components/ui/`.
  4. STOA theme tokens and design notes exist under `src/styles/`.
**Plans**: 2 plans

Plans:
- [x] 04-01: Install and configure TailwindCSS, icons, aliases, and theme files.
- [x] 04-02: Add shadcn-style UI primitive components.

### Phase 5: App Providers, Router, Layouts, and Pages
**Goal**: Establish the app shell with providers, router, layouts, and placeholder routes.
**Depends on**: Phase 4
**Requirements**: [ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04, LAYOUT-05]
**Success Criteria** (what must be TRUE):
  1. `AppProviders` wraps the app with TanStack Query.
  2. `AppRouter` renders `/`, `/chat`, `/dashboard`, `/login`, and not-found routes.
  3. Marketing, app, dashboard, and auth layouts exist.
  4. Placeholder pages render through the router without console errors.
**Plans**: 2 plans

Plans:
- [x] 05-01: Add provider and router infrastructure.
- [x] 05-02: Add layouts and placeholder pages.

### Phase 6: Services, State, Types, Hooks, and Common Components
**Goal**: Add reusable API, state, type, hook, and common component foundations for future product work.
**Depends on**: Phase 5
**Requirements**: [SVC-01, SVC-02, SVC-03, SVC-04, STATE-01, STATE-02, STATE-03, STATE-04, TYPE-01, TYPE-02, TYPE-03, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05]
**Success Criteria** (what must be TRUE):
  1. Axios HTTP client and chat API placeholder exist.
  2. Auth and UI Zustand stores exist.
  3. Shared user, chat, and API types exist.
  4. Common app components exist and can be imported via `@`.
  5. `.env.example` documents the API base URL.
**Plans**: 2 plans

Plans:
- [x] 06-01: Add API services, stores, hooks, and types.
- [x] 06-02: Add common reusable components.

### Phase 7: Acceptance Page, Documentation, and Verification
**Goal**: Prove the Phase 2 stack works through the Home acceptance page, README updates, command verification, and GitHub handoff.
**Depends on**: Phase 6
**Requirements**: [COMP-06, DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05]
**Success Criteria** (what must be TRUE):
  1. Home page uses TailwindCSS, Button/Card UI primitives, React Router links, and `@` imports.
  2. Routes `/`, `/chat`, `/dashboard`, and `/login` are browser-verifiable.
  3. README documents Phase 2 additions, env setup, and routes.
  4. `npm install`, `npm run build`, `npm run lint`, and browser route checks pass.
  5. Phase 2 work is committed and pushed to GitHub.
**Plans**: 2 plans

Plans:
- [x] 07-01: Build Home acceptance page and update README.
- [x] 07-02: Run verification and prepare GitHub handoff.

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6 -> 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vite Foundation App | v1.0 | 2/2 | Complete | 2026-05-24 |
| 2. Tooling Verification | v1.0 | 2/2 | Complete | 2026-05-24 |
| 3. Documentation and Repository Readiness | v1.0 | 2/2 | Complete | 2026-05-24 |
| 4. Styling and UI Foundation | v1.1 | 2/2 | Complete | 2026-05-24 |
| 5. App Providers, Router, Layouts, and Pages | v1.1 | 2/2 | Complete | 2026-05-24 |
| 6. Services, State, Types, Hooks, and Common Components | v1.1 | 2/2 | Complete | 2026-05-24 |
| 7. Acceptance Page, Documentation, and Verification | v1.1 | 2/2 | Complete | 2026-05-24 |
