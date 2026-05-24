# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation and a visible mock product prototype for AI-supported student learning.

The app includes a demonstrable STOA core product UI: a mock-driven student chat workspace, conversation list, message flow, teacher-help placeholder, and student learning dashboard. The next major product step is backend integration for real conversations, messages, teacher-help requests, and dashboard data.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA student chat flow that can switch from mock data to the unified backend Chat API.

## Current Milestone: v1.3 Phase 4 Backend Integration and Real Chat API

**Goal:** Connect the Phase 3 chat UI to the real backend Chat API so conversations, messages, send-message, teacher-help requests, and local FastAPI/Codex-provider integration are driven through the unified STOA backend contract.

**Target features:**
- Define and document the frontend/backend chat API contract for conversations, messages, conversation creation, send-message, and teacher-help request flows.
- Replace `useMockChat` on `/chat` with TanStack Query hooks and Axios service functions that call the backend.
- Add loading, error, empty, pending, and basic operation feedback states for the chat data flow.
- Keep the frontend decoupled from model providers: the backend may use Codex during testing, but the frontend only calls STOA backend endpoints.
- Document local FastAPI integration, CORS expectations, `.env.example`, and the non-streaming Phase 4 response model.

## Current State

**Latest shipped milestone:** v1.2 Core Product UI

**Current milestone:** v1.3 Phase 4 Backend Integration and Real Chat API

**Delivered product surface:**
- `/chat` mock product UI with conversation sidebar, active message list, message bubbles, chat input, upload placeholder, AI thinking state, delayed mock response, and teacher-help placeholder.
- `/dashboard` mock student learning overview with stats, recent questions, weak topics, learning progress, and teacher feedback.
- Mock chat/dashboard contracts and data under `src/types/` and `src/data/`.
- README documentation for Phase 3 Core Product UI.

## Requirements

### Validated

- ✓ Git repository exists for `stoa-frontend` — existing
- ✓ React + TypeScript + Vite dependency foundation exists in `package.json` — existing
- ✓ Initial role route shell exists under `src/pages/**` — existing, but outside Phase 1 scope
- ✓ Basic Cognito/Amplify, Axios, TanStack Query, and Zustand scaffolding exists — existing, but outside Phase 1 scope
- ✓ GSD codebase map exists in `.planning/codebase/` — existing
- ✓ Developers can install, run, build, lint, preview, and inspect the minimal STOA frontend foundation — v1.0
- ✓ Frontend development foundation exists with TailwindCSS, UI primitives, routing, providers, services, stores, layouts, pages, theme notes, and docs — v1.1
- ✓ Developers can run the app and demo mock STOA chat plus student dashboard product UI — v1.2

### Active

- [ ] Frontend and backend share a stable Phase 4 Chat API contract for conversation list, conversation detail, conversation creation, send-message, and teacher-help request endpoints.
- [ ] `/chat` loads conversation summaries and selected conversation messages from the backend rather than `mockConversations`.
- [ ] Sending a chat message calls the backend and refreshes conversation data after the backend returns the student and assistant messages.
- [ ] Request-teacher action calls the backend teacher-help endpoint and surfaces pending/success/error feedback.
- [ ] Chat loading, error, empty, and pending states are visible and usable.
- [ ] README documents local FastAPI integration, CORS requirements, `VITE_API_BASE_URL`, and the testing-stage Codex-provider strategy.

### Out of Scope

- AI streaming — deferred until Phase 5 after the non-streaming backend contract is proven.
- Real file upload — Phase 4 keeps upload out of scope.
- Real login implementation — auth UX and backend auth remain deferred.
- Real teacher routing or tutor queue integration — Phase 4 only calls the request endpoint and handles basic status feedback.
- Parent/tutor/admin dashboard business logic — deferred to future product milestones.
- Payment system — billing and subscriptions are deferred.
- Production deployment — hosting and CI/CD are deferred.
- Direct frontend calls to OpenAI, Claude, Gemini, DeepSeek, Codex, or any other model provider — frontend remains coupled only to STOA backend APIs.
- Production-ready mobile chat drawer — baseline responsive behavior is enough for the current chat surface.

## Context

The project brief for Phase 4 was provided in Chinese and defines the backend integration milestone for the existing chat UI. It is not a streaming, upload, authentication, dashboard API, or production deployment milestone; it is focused on proving the real chat data flow through a unified backend API.

Recommended baseline technology:
- React for long-term frontend scalability.
- TypeScript for team collaboration and safer changes.
- Vite for fast development startup and lightweight configuration.
- npm as the default package manager.
- GitHub as the shared repository host, expected at `https://github.com/stoasystem/stoa-frontend`.

Current codebase facts:
- v1.0 shipped the minimal STOA Vite app.
- v1.1 shipped TailwindCSS, shadcn-style UI primitives, routing, providers, API services, stores, layouts, common components, and documentation.
- v1.2 shipped the first mock product UI for `/chat` and `/dashboard`.
- The chat/dashboard UI is props-driven and mock-data-backed so v1.3 can replace local chat data with TanStack Query and Axios API flows.
- During the testing stage, the backend may use Codex as a temporary AI provider behind its own provider layer. The frontend must not depend on provider-specific APIs or environment variables.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 4 integrates chat backend APIs only; dashboard backend integration, auth enforcement, uploads, streaming, and deployment stay out of scope.
- **Model providers**: The frontend must call only the STOA backend API; Codex usage during testing belongs behind the backend provider layer.
- **Local backend**: FastAPI is expected at `http://localhost:8000` during local integration, with frontend dev server at `http://localhost:5173`.
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
| Keep Phase 3 mock-driven | Lets the team demo the core student experience before backend contracts are ready | ✓ Good |
| Keep chat/dashboard components props-driven | Makes Phase 4 API replacement possible without rewriting UI modules | ✓ Good |
| Continue phase numbering into v1.3 | Keeps GSD history continuous; Phase 4 product work will use GSD Phase 11+ execution numbers | ✓ Good |
| Keep model-provider calls behind the backend | Lets testing use Codex now and swap providers later without frontend contract churn | — Pending |
| Use non-streaming HTTP responses for Phase 4 chat replies | Proves the backend data path before adding streaming complexity in Phase 5 | — Pending |

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
*Last updated: 2026-05-24 after v1.3 milestone initialization*
