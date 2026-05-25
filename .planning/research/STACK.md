# Phase 14 Research: Stack

## Question

What stack additions or changes are needed to stabilize a lightweight demo backend for STOA Frontend without turning it into production backend architecture?

## Current Context

- Frontend stack remains React, TypeScript, Vite, npm, Axios, TanStack Query, Zustand, and Playwright.
- Existing local test backend lives under `backend/` and uses FastAPI plus SQLite for previous functional testing.
- Current frontend services already centralize many API calls under `src/services/**` and `src/services/api/httpClient.ts`.
- Phase 14 requires demo auth, conversations, teacher help, parent reporting, billing, referrals, support, admin analytics, health, reset, API modes, and backend integration docs.

## Options Reviewed

### Option A: MSW plus mock data

MSW intercepts network requests at the request layer and can mock REST/GraphQL APIs across browser and Node environments. It is strongest when the frontend needs realistic request/response behavior without running a backend process.

Source: https://mswjs.io/

Fit for Phase 14:
- Good for frontend-only development and test scenarios.
- Good for error-state simulation and service-layer verification.
- Weak for shared demo state unless state is kept in memory/browser storage or backed by a small local persistence mechanism.
- Adds a new dependency and mock-worker setup.

### Option B: json-server

json-server can expose REST-style resources from a JSON file with minimal setup, including common collection routes like GET, POST, PUT, PATCH, and DELETE.

Source: https://github.com/typicode/json-server

Fit for Phase 14:
- Good for simple CRUD-style JSON data.
- Weak for custom auth, token mapping, nested role-specific endpoints, mock checkout behavior, streaming-like chat behavior, and standardized error responses.
- Current v1 docs are beta and may introduce behavior changes, so it is not ideal as the core Phase 14 path.

### Option C: Minimal Express demo backend

Express exposes straightforward HTTP routing through `app.METHOD(PATH, HANDLER)` and keeps Node/TypeScript close to the frontend stack.

Source: https://expressjs.com/en/starter/basic-routing.html

Fit for Phase 14:
- Good if the team wants a JavaScript/TypeScript-only demo backend.
- Requires adding backend dependencies and scripts.
- Fits JSON-file state and custom endpoints well.
- Duplicates some existing local backend work already present in `backend/`.

### Option D: Minimal FastAPI demo backend

FastAPI maps HTTP methods and paths to Python path operations and returns JSON naturally.

Source: https://fastapi.tiangolo.com/tutorial/first-steps/

Fit for Phase 14:
- Good because the repo already has a local FastAPI backend.
- Avoids introducing a second backend runtime solely for demo support.
- Can expose custom auth, parent/tutor/admin/billing/referral/support routes and reset behavior.
- Must avoid expanding into formal database, ORM, migrations, or production architecture.

## Recommendation

Use the existing local FastAPI backend as the immediate Phase 14 demo backend foundation, but simplify and document it as demo-only:

- Keep a minimal route surface.
- Prefer JSON-file or explicit seed/reset data over complex persistence for demo state.
- Keep SQLite only if existing code makes removal risky; document it as local/demo/test support, not production architecture.
- Add `npm run demo:backend` and `npm run demo:reset` wrappers if practical so frontend developers can stay on npm scripts.
- Keep frontend API switching through `VITE_API_MODE`, `VITE_API_BASE_URL`, and optional `VITE_ENABLE_MSW`.

MSW remains a useful optional `mock` mode, but Phase 14 should not block on adding full MSW if the immediate goal is a stable local demo backend.

## What Not To Add

- Prisma, TypeORM, SQLAlchemy models, Alembic migrations, production SQL schema, Docker Compose, Kubernetes, AWS CDK, real Cognito wiring, Stripe webhooks, real AI provider orchestration, or production analytics storage.

