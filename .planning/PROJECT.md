# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation and is moving into the first visible product prototype for AI-supported student learning.

The current milestone upgrades the app from a frontend foundation into a demonstrable STOA core product UI: a mock-driven student chat workspace, conversation list, message flow, teacher-help placeholder, and student learning dashboard.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and see a credible STOA product prototype that demonstrates the core student AI learning flow with mock data.

## Current Milestone: v1.2 Core Product UI

**Goal:** Build the first demonstrable STOA product interface with a mock-driven student chat experience and student dashboard on top of the Phase 2 frontend foundation.

**Target features:**
- Add chat and dashboard-specific type definitions for the mock product UI.
- Add mock conversation and student dashboard data under `src/data/`.
- Build a props-driven chat interface with conversation sidebar, message list, message bubbles, input, upload placeholder, AI thinking state, and teacher-help placeholder.
- Add `useMockChat` for local mock message sending and delayed assistant responses.
- Build the student dashboard with stats, recent questions, weak topics, learning progress, and teacher feedback modules.
- Keep the UI responsive enough for desktop and mobile baseline checks.
- Update README with Phase 3 Core Product UI documentation and verify npm scripts.

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

- [ ] User can open `/chat` and see a conversation-oriented STOA chat workspace.
- [ ] User can switch between mock conversations and see the corresponding messages.
- [ ] User can send a mock chat message and see an AI thinking state followed by a mock assistant response.
- [ ] User can see upload and teacher-help entry points as placeholders for later backend integration.
- [ ] User can open `/dashboard` and see a student learning overview with mock stats, recent questions, weak topics, progress, and teacher feedback.
- [ ] Developers can replace mock data with future API-backed TanStack Query flows without rewriting the UI components.

### Out of Scope

- Real backend API integration — Phase 3 uses mock data only.
- Real AI chat functionality — the assistant response is simulated locally.
- AI streaming — deferred until the backend chat contract exists.
- Real file upload — Phase 3 only exposes an upload affordance.
- Real login implementation — auth UX and backend auth remain deferred.
- Real teacher routing or tutor queue integration — Phase 3 only exposes a request-teacher placeholder.
- Parent/tutor/admin dashboard business logic — deferred to future product milestones.
- Payment system — billing and subscriptions are deferred.
- Production deployment — hosting and CI/CD are deferred.
- Production-ready mobile chat drawer — baseline responsive behavior is enough for Phase 3.

## Context

The project brief for Phase 3 was provided in Chinese and defines the first core product UI milestone. It is not a backend integration milestone; it is a mock-data prototype milestone focused on making the student AI learning flow visible, clickable, and demoable.

Recommended baseline technology:
- React for long-term frontend scalability.
- TypeScript for team collaboration and safer changes.
- Vite for fast development startup and lightweight configuration.
- npm as the default package manager.
- GitHub as the shared repository host, expected at `https://github.com/stoasystem/stoa-frontend`.

Current codebase facts:
- v1.0 shipped the minimal STOA Vite app.
- v1.1 shipped TailwindCSS, shadcn-style UI primitives, routing, providers, API services, stores, layouts, common components, and documentation.
- `/chat` and `/dashboard` currently exist as placeholder routes and should be upgraded into the first product UI.
- `src/types/chat.ts` already exists from the foundation milestone but needs to be expanded for conversation metadata, message status, subject, and grade.
- The README describes Phase 2 and must be expanded for Phase 3.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 3 must avoid backend integration and use mock data to demonstrate core product UI only.
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
| Continue phase numbering into v1.2 | Keeps GSD history continuous across frontend foundation and product UI milestones | ✓ Good |
| Keep Phase 3 mock-driven | Lets the team demo the core student experience before backend contracts are ready | — Pending |
| Keep chat/dashboard components props-driven | Makes Phase 4 API replacement possible without rewriting UI modules | — Pending |

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
*Last updated: 2026-05-24 after v1.2 milestone initialization*
