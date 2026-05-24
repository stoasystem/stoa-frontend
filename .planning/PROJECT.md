# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The immediate project goal is to establish a clean, standard, maintainable frontend foundation that developers can clone, install, run locally, build, and use as the base for later STOA product features.

The current repository already contains an early React/Vite shell with role route stubs, Cognito/Amplify configuration, an Axios API client, TanStack Query provider setup, and Zustand stores. The first planned milestone is to reconcile that repository with a stable Phase 1 frontend foundation: a minimal STOA initialization page, complete Vite scaffold, clear README, correct ignore rules, and verified local dev/build commands.

## Core Value

Developers can clone `stoa-frontend`, run `npm install` and `npm run dev`, and see a working STOA frontend foundation at `http://localhost:5173/`.

## Current Milestone: v1.0 Frontend Foundation

**Goal:** Make the STOA frontend repository a clean, runnable, buildable React + TypeScript + Vite project ready for team development.

**Target features:**
- Complete the standard Vite React TypeScript project scaffold.
- Replace default or placeholder code with a minimal STOA initialization page.
- Verify local development, lint, build, and preview basics.
- Document the local development workflow in README.
- Keep the repository clean for GitHub collaboration.

## Requirements

### Validated

- ✓ Git repository exists for `stoa-frontend` — existing
- ✓ React + TypeScript + Vite dependency foundation exists in `package.json` — existing
- ✓ Initial role route shell exists under `src/pages/**` — existing, but outside Phase 1 scope
- ✓ Basic Cognito/Amplify, Axios, TanStack Query, and Zustand scaffolding exists — existing, but outside Phase 1 scope
- ✓ GSD codebase map exists in `.planning/codebase/` — existing
- ✓ Developers can install, run, build, lint, preview, and inspect the minimal STOA frontend foundation — v1.0

### Active

(None currently — v1.0 Frontend Foundation is complete)

### Out of Scope

- Complete page design — Phase 1 only proves the foundation runs.
- Backend API integration — later phases will define real API contracts and data flows.
- Login system — Cognito scaffolding may exist, but auth UX is not part of Phase 1.
- AI chat functionality — core AI learning workflows are deferred.
- Dashboards — student, parent, teacher, and admin dashboards are deferred.
- Payment system — billing and subscriptions are deferred.
- Real data state management — no production data flows in Phase 1.
- Deployment configuration — hosting and CI/CD are deferred.
- Formal business directory structure — folders such as `components`, `services`, `hooks`, `store`, and `types` should be added when the features need them.

## Context

The project brief for Phase 1 was provided in Chinese and defines a narrow foundation milestone. Its acceptance statement is: a developer can clone the project, run `npm install`, then `npm run dev`, and start the STOA frontend locally.

Recommended baseline technology:
- React for long-term frontend scalability.
- TypeScript for team collaboration and safer changes.
- Vite for fast development startup and lightweight configuration.
- npm as the default package manager.
- GitHub as the shared repository host, expected at `https://github.com/stoasystem/stoa-frontend`.

Current codebase facts from `.planning/codebase/`:
- `package.json` already includes React 19, React Router 7, TanStack Query 5, Zustand 5, Axios, AWS Amplify 6, TypeScript, Vite, and ESLint.
- `vite.config.ts` configures Vite on port `5173` and proxies `/api` to `http://localhost:8000`.
- `src/main.tsx` currently configures Amplify and React Query before rendering `App`.
- `src/App.tsx` currently defines role routes for student, parent, teacher, and admin pages.
- Existing role pages are TODO placeholders.
- The repository is missing standard Vite scaffold files such as `index.html`, TypeScript config files, and a lockfile.
- README currently describes a later-stage stack with Cognito and API env variables, not the narrow Phase 1 foundation target.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 1 must avoid business feature implementation and focus on runnable foundation only.
- **Repository hygiene**: `node_modules/`, `dist/`, and local env files must not be committed.
- **Developer workflow**: The project must be usable through standard npm scripts.
- **GitHub**: The intended remote is `https://github.com/stoasystem/stoa-frontend`, but remote setup depends on repository access and should be verified before push.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React + TypeScript + Vite | Matches the Phase 1 brief and gives a fast, maintainable frontend base | — Pending |
| Use npm | Default toolchain is simple for team members | — Pending |
| Keep Phase 1 as foundation-only | Prevents premature feature work before the repo can run and build cleanly | — Pending |
| Treat existing role/API/auth scaffolding as non-Phase-1 context | The current repo includes later-stage placeholders, but Phase 1 acceptance is only the foundation | — Pending |
| Complete v1.0 before expanding product features | Foundation commands and handoff documentation now pass, so later milestones can build on a stable base | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after v1.0 milestone audit*
