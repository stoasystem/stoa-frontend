# Roadmap: STOA Frontend

## Overview

The v1.0 milestone turns the current STOA frontend repository into a reliable React + TypeScript + Vite foundation. The work is intentionally narrow: first normalize the runnable Vite application surface, then make the local tooling pass, then update documentation and repository hygiene so teammates can clone and run the project confidently.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Vite Foundation App** - Complete the standard Vite scaffold and render the minimal STOA initialization page.
- [ ] **Phase 2: Tooling Verification** - Make build, lint, preview, lockfile, and ignore rules work for a clean checkout.
- [ ] **Phase 3: Documentation and Repository Readiness** - Align README and commit history with the Phase 1 handoff and GitHub readiness expectations.

## Phase Details

### Phase 1: Vite Foundation App
**Goal**: Complete the standard Vite React TypeScript scaffold and replace placeholder/demo UI with a minimal STOA initialization page.
**Depends on**: Nothing (first phase)
**Requirements**: [SCFD-01, SCFD-02, SCFD-03, SCFD-04, APP-01, APP-02, APP-03]
**Success Criteria** (what must be TRUE):
  1. Developer can install dependencies from a clean checkout with `npm install`.
  2. Developer can run `npm run dev` and load the app at `http://localhost:5173/`.
  3. User sees a minimal STOA frontend initialization page at the root route.
  4. Default Vite demo assets and unfinished business route placeholders are not exposed as the Phase 1 first screen.
  5. The project has the standard Vite HTML and TypeScript config files needed by the app.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Add missing Vite scaffold files and normalize app entry points.
- [ ] 01-02: Replace placeholder route surface with the minimal STOA foundation page.

### Phase 2: Tooling Verification
**Goal**: Make local build, lint, preview, lockfile, and repository ignore rules reliable.
**Depends on**: Phase 1
**Requirements**: [TOOL-01, TOOL-02, TOOL-03, TOOL-04]
**Success Criteria** (what must be TRUE):
  1. Developer can run `npm run build` successfully.
  2. Developer can run `npm run lint` successfully.
  3. Developer can run `npm run preview` after a production build.
  4. `.gitignore` excludes dependencies, build output, env files, `.DS_Store`, and local-only noise.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Add or fix TypeScript, ESLint, and package tooling configuration.
- [ ] 02-02: Run verification commands and address failures.

### Phase 3: Documentation and Repository Readiness
**Goal**: Document the foundation workflow and ensure the repository is ready for initial GitHub handoff.
**Depends on**: Phase 2
**Requirements**: [DOCS-01, DOCS-02, DOCS-03, DOCS-04, REPO-01, REPO-02, REPO-03]
**Success Criteria** (what must be TRUE):
  1. README explains the STOA frontend purpose, stack, install, dev, build, and preview commands.
  2. README states that Phase 1 frontend foundation is initialized.
  3. Repository status contains no committed dependencies or build output.
  4. Git history contains clear commits for the foundation work.
  5. GitHub push readiness is documented, with remote setup left to the user if credentials or repository access are unavailable.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Rewrite README for the Phase 1 foundation handoff.
- [ ] 03-02: Verify repository hygiene and document GitHub readiness.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Vite Foundation App | 2/2 | Complete | 2026-05-24 |
| 2. Tooling Verification | 0/2 | Not started | - |
| 3. Documentation and Repository Readiness | 0/2 | Not started | - |
