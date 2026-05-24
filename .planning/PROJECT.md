# STOA Frontend

## What This Is

STOA Frontend is the React + TypeScript + Vite frontend for the STOA learning platform. The project now has a stable development foundation, visible product UI, and a backend-integrated student chat flow for real conversation data.

The app includes a STOA core product UI with a backend-driven student chat workspace, conversation list, message flow, teacher-help request path, and a mock student learning dashboard. The current product step is upgrading `/chat` into a richer real learning workflow with streaming assistant responses, stop/retry controls, homework file upload, attachment-aware messages, and stateful teacher escalation.

## Core Value

Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA student chat workflow backed only by the unified STOA backend API contract.

## Current Milestone: v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow

**Goal:** Upgrade `/chat` from ordinary HTTP Q&A to a real AI learning workflow with streaming assistant output, stop/retry controls, homework attachments, and stateful teacher help.

**Target features:**
- Streaming assistant responses through `POST /conversations/:conversationId/messages/stream`.
- Abort generation and mark stopped assistant messages.
- Basic retry for failed user messages.
- New conversation flow available from the active chat workspace.
- PNG, JPEG, and PDF homework upload with validation, upload state, and attachment previews.
- Attachment IDs sent with chat messages.
- Teacher-help request status display for pending, assigned, in-progress, and resolved states.
- README and local integration documentation for Phase 5 endpoints and backend-only AI provider strategy.

## Current State

**Latest shipped milestone:** v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow

**Delivered product surface:**
- `/chat` mock product UI with conversation sidebar, active message list, message bubbles, chat input, upload placeholder, AI thinking state, delayed mock response, and teacher-help placeholder.
- `/chat` backend-integrated product UI with conversation list/detail queries, create-conversation, send-message, teacher-help request, and API state handling.
- `/chat` streaming product UI with optimistic student messages, streaming assistant placeholders, stop generation, failed-message retry, attachment upload/preview, attachment-aware sends, and stateful teacher-help status display.
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
- ✓ Developers can run the app and exercise STOA chat through the unified backend Chat API contract — v1.3
- ✓ Developers can run the app and exercise a streaming STOA chat workflow with file attachments and teacher-help status through the unified backend API contract — v1.4

### Active

(None currently — v1.4 Phase 5 Streaming Chat, File Upload, and Real Learning Workflow is implemented)

### Out of Scope

- Real login implementation — auth UX and backend auth remain deferred.
- Real teacher routing or tutor queue integration — Phase 5 shows request status only; live multi-person teacher chat remains deferred.
- Parent/tutor/admin dashboard business logic — deferred to future product milestones.
- Payment system — billing and subscriptions are deferred.
- Production deployment — hosting and CI/CD are deferred.
- Direct frontend calls to OpenAI, Claude, Gemini, DeepSeek, Codex, or any other model provider — frontend remains coupled only to STOA backend APIs.
- Production-ready mobile chat drawer — baseline responsive behavior is enough for the current chat surface.
- Full OCR/PDF parsing management UI — Phase 5 only integrates upload metadata and optional parsed status.
- Long-term memory management — deferred until later AI workflow milestones.

## Context

The project brief for Phase 5 was provided in Chinese and defines the streaming chat, file upload, and real learning workflow milestone. It builds on v1.3's backend-integrated chat flow and keeps the same backend-only AI provider boundary while adding a streaming frontend protocol and richer local UI states.

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
- v1.3 shipped backend-integrated `/chat` data flow using TanStack Query and Axios API services.
- v1.4 shipped the Phase 5 real learning workflow: streaming response handling, upload attachments, retry, stop generation, new conversation flow, and teacher-help status progression.
- During the testing stage, the backend may use Codex as a temporary AI provider behind its own provider layer. The frontend must not depend on provider-specific APIs or environment variables.

## Constraints

- **Tech stack**: React, TypeScript, Vite, npm — specified by the Phase 1 project brief.
- **Runtime**: Node.js 20 LTS or newer LTS is recommended for local development.
- **Scope**: Phase 5 upgrades `/chat` only; full parent/tutor dashboards, auth enforcement, payments, live teacher chat, and deployment stay out of scope.
- **Model providers**: The frontend must call only the STOA backend API; Codex usage during testing belongs behind the backend provider layer.
- **Local backend**: FastAPI is expected at `http://localhost:8000` during local integration, with frontend dev server at `http://localhost:5173`.
- **Streaming**: The frontend supports SSE/fetch streaming from the backend and must not call provider-specific streaming APIs directly.
- **Uploads**: Phase 5 supports PNG, JPEG, and PDF homework uploads up to 10 MB per file and at most 3 pending attachments per send.
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
| Add create-conversation support in empty chat state | Prevents first-time users from hitting a dead end when the backend returns no conversations | ✓ Good |
| Use fetch for streaming chat | Browser ReadableStream handling is simpler through fetch than Axios | — Pending |
| Keep token-level streaming state local to React | Avoids high-frequency global Zustand updates and keeps canonical data in TanStack Query | — Pending |
| Treat uploaded files as backend attachment metadata | Keeps OCR/PDF parsing behind backend APIs and lets frontend send only attachment IDs | — Pending |

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
*Last updated: 2026-05-24 after v1.4 milestone initialization*
