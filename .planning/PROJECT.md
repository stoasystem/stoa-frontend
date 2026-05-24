# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The immediate project goal is to establish a clean, standard, maintainable frontend foundation that developers can clone, install, run locally, build, and use as the base for later STOA product features.

The repository now has a verified React + TypeScript + Vite foundation from v1.0. The next milestone upgrades that foundation into the formal STOA frontend development base: TailwindCSS, shadcn-style UI primitives, routing, providers, API services, Zustand stores, layouts, placeholder pages, STOA theme entry, and documentation for continued product development.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and continue STOA product work from a stable, organized frontend application foundation.

## Current Milestone: v1.1 Frontend Development Foundation

**Goal:** Turn the Phase 1 Vite foundation into a formal STOA frontend development base with styling, routing, providers, API layer, state stores, layouts, placeholder pages, theme entry, and documentation.

**Target features:**
- Configure TailwindCSS and shadcn-style UI primitives.
- Establish the STOA app directory structure.
- Add React Router routes for `/`, `/chat`, `/dashboard`, `/login`, and not-found.
- Add TanStack Query providers and query client.
- Add Axios API client, API types, and chat API placeholder.
- Add Zustand auth/UI stores and foundational global types/hooks.
- Add Marketing/App layouts and common reusable components.
- Add STOA theme tokens and design notes entry.
- Update README, verify npm scripts, and push a clear Phase 2 commit series.

## Requirements

### Validated

- ✓ Git repository exists for `stoa-frontend` — existing
- ✓ React + TypeScript + Vite dependency foundation exists in `package.json` — existing
- ✓ Initial role route shell exists under `src/pages/**` — existing, but outside Phase 1 scope
- ✓ Basic Cognito/Amplify, Axios, TanStack Query, and Zustand scaffolding exists — existing, but outside Phase 1 scope
- ✓ GSD codebase map exists in `.planning/codebase/` — existing
- ✓ Developers can install, run, build, lint, preview, and inspect the minimal STOA frontend foundation — v1.0
- ✓ Frontend development foundation exists with TailwindCSS, UI primitives, routing, providers, services, stores, layouts, pages, theme notes, and docs — v1.1

### Active

(None currently — v1.1 Frontend Development Foundation is complete)

### Out of Scope

- Complete UI design — Phase 2 establishes layout/style systems but does not finalize product screens.
- Real backend API integration — Phase 2 creates request structure only.
- Real login implementation — route and store placeholders are allowed, but auth UX and backend auth are deferred.
- Real AI chat functionality — chat route and API placeholder only.
- AI streaming — deferred until API contract exists.
- Parent/tutor/admin dashboard business logic — deferred to product UI milestones.
- Payment system — billing and subscriptions are deferred.
- Production deployment — hosting and CI/CD are deferred.
- Full STOA homepage replication — Phase 2 creates design notes and theme entry, not a complete migration.

## Context

The project brief for Phase 2 was provided in Chinese and defines an engineering foundation milestone. It does not ask for business functionality; it asks for the structure future STOA AI learning platform pages will use.

Recommended baseline technology:
- React for long-term frontend scalability.
- TypeScript for team collaboration and safer changes.
- Vite for fast development startup and lightweight configuration.
- npm as the default package manager.
- GitHub as the shared repository host, expected at `https://github.com/stoasystem/stoa-frontend`.

Current codebase facts:
- v1.0 has a working minimal STOA Vite app.
- `package.json` already includes React Router, TanStack Query, Zustand, Axios, and AWS Amplify from earlier scaffolding.
- TailwindCSS, lucide-react, UI primitives, route/layout structure, API services, and Phase 2 docs still need to be added.
- The v1.0 README describes the foundation scripts and must be expanded for Phase 2.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 2 must avoid real business implementation and focus on formal development foundations only.
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
| Continue phase numbering into v1.1 | Keeps GSD history continuous across milestones | ✓ Good |
| Use shadcn-style local UI components | Provides copyable, customizable primitives without coupling future work to opaque component packages | ✓ Good |

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
*Last updated: 2026-05-24 after v1.1 milestone audit*
