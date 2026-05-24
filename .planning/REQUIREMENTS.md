# Requirements: STOA Frontend

**Defined:** 2026-05-24
**Core Value:** Developers can clone `stoa-frontend`, run `npm install` and `npm run dev`, and see a working STOA frontend foundation at `http://localhost:5173/`.

## v1 Requirements

Requirements for the initial frontend foundation milestone. Each maps to roadmap phases.

### Scaffold

- [ ] **SCFD-01**: Developer can install dependencies with `npm install` from a clean checkout.
- [ ] **SCFD-02**: Developer can run `npm run dev` and start the Vite dev server on `http://localhost:5173/`.
- [ ] **SCFD-03**: Project includes the standard Vite React TypeScript scaffold files required for local development and production builds.
- [ ] **SCFD-04**: Project includes a committed npm lockfile so installs are reproducible across team machines.

### Application

- [ ] **APP-01**: User can open the root route and see a minimal STOA frontend initialization page.
- [ ] **APP-02**: Default Vite demo content, demo assets, and unused demo imports are removed.
- [ ] **APP-03**: Phase 1 app surface avoids unfinished business flows such as login, dashboards, AI chat, payment, and backend data views.

### Tooling

- [ ] **TOOL-01**: Developer can run `npm run build` successfully.
- [ ] **TOOL-02**: Developer can run `npm run lint` successfully.
- [ ] **TOOL-03**: Developer can run `npm run preview` after a production build.
- [ ] **TOOL-04**: `.gitignore` excludes `node_modules/`, `dist/`, local env files, `.DS_Store`, and local-only editor or machine noise.

### Documentation

- [ ] **DOCS-01**: README identifies the project as the STOA learning platform frontend.
- [ ] **DOCS-02**: README documents the Phase 1 stack: React, TypeScript, Vite, and npm.
- [ ] **DOCS-03**: README documents local install, development, build, and preview commands.
- [ ] **DOCS-04**: README states the current project status as Phase 1 frontend foundation initialized.

### Repository

- [ ] **REPO-01**: Repository contains no committed `node_modules/` or build output.
- [ ] **REPO-02**: Repository is ready for an initial GitHub push to `stoasystem/stoa-frontend` once remote access is configured.
- [ ] **REPO-03**: Initial foundation work is committed with a clear commit history.

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Frontend Platform

- **PLAT-01**: Developer can use TailwindCSS for styling.
- **PLAT-02**: Developer can use shadcn/ui component primitives.
- **PLAT-03**: Developer can use lucide-react icons.
- **PLAT-04**: Developer can use React Router for the formal route structure.
- **PLAT-05**: Developer can use TanStack Query for API-backed server state.
- **PLAT-06**: Developer can use Zustand for client state.
- **PLAT-07**: Developer can use Axios through a documented API layer.

### Product Features

- **AUTH-01**: User can log in through the STOA authentication flow.
- **AI-01**: Student can ask an AI-assisted learning question.
- **DASH-01**: Student, parent, teacher, and admin users can access role-specific dashboards.
- **PAY-01**: User can access payment or subscription flows.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complete page design | Phase 1 only proves the foundation runs. |
| Backend API integration | Later milestones should define real API contracts and data flows. |
| Login system | Auth UX is explicitly excluded from Phase 1. |
| AI chat | Core AI product workflows are deferred. |
| Dashboards | Role dashboards are deferred until the frontend platform is ready. |
| Payment system | Billing and subscriptions are deferred. |
| Real data state management | Phase 1 has no production data flows. |
| Deployment configuration | Hosting and CI/CD are not required for the foundation milestone. |
| Large business directory scaffold | Business directories should be added when real features need them. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCFD-01 | Phase 1 | Complete |
| SCFD-02 | Phase 1 | Complete |
| SCFD-03 | Phase 1 | Complete |
| SCFD-04 | Phase 1 | Complete |
| APP-01 | Phase 1 | Complete |
| APP-02 | Phase 1 | Complete |
| APP-03 | Phase 1 | Complete |
| TOOL-01 | Phase 2 | Complete |
| TOOL-02 | Phase 2 | Complete |
| TOOL-03 | Phase 2 | Complete |
| TOOL-04 | Phase 2 | Complete |
| DOCS-01 | Phase 3 | Complete |
| DOCS-02 | Phase 3 | Complete |
| DOCS-03 | Phase 3 | Complete |
| DOCS-04 | Phase 3 | Complete |
| REPO-01 | Phase 3 | Complete |
| REPO-02 | Phase 3 | Complete |
| REPO-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after initialization*
