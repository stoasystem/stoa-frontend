# Requirements: STOA Frontend v1.1 Frontend Development Foundation

**Defined:** 2026-05-24
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and continue STOA product work from a stable, organized frontend application foundation.

## v1.1 Requirements

Requirements for the second-stage frontend development foundation milestone. Each maps to roadmap phases.

### Styling

- [ ] **STYLE-01**: Developer can use TailwindCSS utility classes in app pages and components.
- [ ] **STYLE-02**: Vite is configured with the TailwindCSS Vite plugin.
- [ ] **STYLE-03**: shadcn-style UI primitives exist under `src/components/ui/` for button, card, input, textarea, label, separator, badge, avatar, tabs, dialog, sheet, dropdown menu, and scroll area.
- [ ] **STYLE-04**: STOA theme tokens exist in `src/styles/stoa-theme.css`.
- [ ] **STYLE-05**: STOA design migration notes exist in `src/styles/design-notes.md`.
- [ ] **STYLE-06**: `lucide-react` is installed for the icon system.

### Architecture

- [ ] **ARCH-01**: Project has the Phase 2 directory structure for `app`, `components`, `layouts`, `pages`, `services`, `store`, `types`, `hooks`, `lib`, and `styles`.
- [ ] **ARCH-02**: Vite and TypeScript support the `@/*` path alias.
- [ ] **ARCH-03**: `AppProviders` wraps the app with TanStack Query.
- [ ] **ARCH-04**: `queryClient` configures retry, stale time, and refetch behavior for server state.
- [ ] **ARCH-05**: `AppRouter` defines routes for `/`, `/chat`, `/dashboard`, `/login`, and `*`.

### Layouts

- [ ] **LAYOUT-01**: `MarketingLayout` provides a public navigation shell.
- [ ] **LAYOUT-02**: `AppLayout` provides an authenticated-app style shell.
- [ ] **LAYOUT-03**: `DashboardLayout` exists as a dashboard-specific shell.
- [ ] **LAYOUT-04**: `AuthLayout` exists as an auth-page shell.
- [ ] **LAYOUT-05**: Home, chat, dashboard, login, and not-found pages render through the router.

### Services

- [ ] **SVC-01**: `.env.example` documents `VITE_API_BASE_URL`.
- [ ] **SVC-02**: `services/api/httpClient.ts` exports an Axios client with JSON headers and bearer token injection from local storage.
- [ ] **SVC-03**: `services/api/apiTypes.ts` defines reusable API response and error types.
- [ ] **SVC-04**: `services/chat/chatApi.ts` defines a placeholder chat message request and response API.

### State

- [ ] **STATE-01**: `store/authStore.ts` defines user, token, authenticated state, `setAuth`, and `clearAuth`.
- [ ] **STATE-02**: `store/uiStore.ts` defines sidebar open state and setter.
- [ ] **STATE-03**: `hooks/useAuth.ts` exposes the auth store.
- [ ] **STATE-04**: `hooks/useCurrentUser.ts` exposes current user state.

### Types

- [ ] **TYPE-01**: `types/user.ts` defines shared user and role types.
- [ ] **TYPE-02**: `types/chat.ts` defines shared chat conversation and message types.
- [ ] **TYPE-03**: `types/api.ts` defines reusable pagination types.

### Components

- [ ] **COMP-01**: Common `AppLogo` component exists.
- [ ] **COMP-02**: Common `PageShell` component exists.
- [ ] **COMP-03**: Common `LoadingState` component exists.
- [ ] **COMP-04**: Common `ErrorState` component exists.
- [ ] **COMP-05**: Common `EmptyState` component exists.
- [ ] **COMP-06**: Home page uses TailwindCSS, shadcn-style Button/Card components, React Router links, and the `@` alias.

### Documentation

- [ ] **DOCS-01**: README documents Phase 2 frontend foundation additions.
- [ ] **DOCS-02**: README documents environment variable setup through `.env.example`.
- [ ] **DOCS-03**: README lists available routes.
- [ ] **DOCS-04**: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, and preview route checks pass.
- [ ] **DOCS-05**: Phase 2 work is committed and pushed to GitHub.

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Product UI

- **CHAT-01**: Student can use a real chat UI with conversation list, message bubbles, input, upload affordance, AI response placeholder, and teacher escalation placeholder.
- **DASH-01**: Student dashboard has real learning progress UI.
- **AUTH-01**: User can register, log in, and persist sessions through real auth integration.
- **STREAM-01**: AI chat supports streaming responses.
- **UPLOAD-01**: User can upload files for AI-supported learning.
- **PAY-01**: Payment and subscription flows exist.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complete UI design | Phase 2 only establishes the development foundation and acceptance page. |
| Real login implementation | Auth is represented by structure and stores only. |
| Real backend business API integration | API layer exists, but backend contracts are future work. |
| Real AI chat behavior | Chat route and API placeholder only. |
| AI streaming | Requires a later API and UI contract. |
| Parent/tutor/admin dashboard business logic | Product dashboards are deferred. |
| Payment | Explicitly excluded from Phase 2. |
| Production deployment | Not part of this milestone. |
| Full STOA homepage replication | Phase 2 creates style notes and tokens only. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STYLE-01 | Phase 4 | Complete |
| STYLE-02 | Phase 4 | Complete |
| STYLE-03 | Phase 4 | Complete |
| STYLE-04 | Phase 4 | Complete |
| STYLE-05 | Phase 4 | Complete |
| STYLE-06 | Phase 4 | Complete |
| ARCH-01 | Phase 5 | Pending |
| ARCH-02 | Phase 5 | Pending |
| ARCH-03 | Phase 5 | Pending |
| ARCH-04 | Phase 5 | Pending |
| ARCH-05 | Phase 5 | Pending |
| LAYOUT-01 | Phase 5 | Pending |
| LAYOUT-02 | Phase 5 | Pending |
| LAYOUT-03 | Phase 5 | Pending |
| LAYOUT-04 | Phase 5 | Pending |
| LAYOUT-05 | Phase 5 | Pending |
| SVC-01 | Phase 6 | Pending |
| SVC-02 | Phase 6 | Pending |
| SVC-03 | Phase 6 | Pending |
| SVC-04 | Phase 6 | Pending |
| STATE-01 | Phase 6 | Pending |
| STATE-02 | Phase 6 | Pending |
| STATE-03 | Phase 6 | Pending |
| STATE-04 | Phase 6 | Pending |
| TYPE-01 | Phase 6 | Pending |
| TYPE-02 | Phase 6 | Pending |
| TYPE-03 | Phase 6 | Pending |
| COMP-01 | Phase 6 | Pending |
| COMP-02 | Phase 6 | Pending |
| COMP-03 | Phase 6 | Pending |
| COMP-04 | Phase 6 | Pending |
| COMP-05 | Phase 6 | Pending |
| COMP-06 | Phase 7 | Pending |
| DOCS-01 | Phase 7 | Pending |
| DOCS-02 | Phase 7 | Pending |
| DOCS-03 | Phase 7 | Pending |
| DOCS-04 | Phase 7 | Pending |
| DOCS-05 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after v1.1 initialization*
