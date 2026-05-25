# Phase 14 Research: Architecture

## Question

How should demo backend stabilization integrate with the existing STOA frontend architecture?

## Existing Architecture

- Browser SPA built with React, TypeScript, Vite, React Router, TanStack Query, Axios, Zustand, and service modules.
- API calls should flow through `src/services/**` and shared API utilities, not page components.
- Existing local backend under `backend/` already provides previous auth/chat/parent/tutor/support/analytics-style demo and test support.
- Prior milestones established that local backend/database code is demo/test infrastructure only.

## Target Architecture

### Frontend

- `src/lib/env.ts` exposes:
  - `apiMode`
  - `apiBaseUrl`
  - `enableMSW`
- `src/services/api/httpClient.ts` owns base URL, auth header, timeout, and error normalization.
- Feature services own endpoint paths and types.
- Components use hooks/services and avoid direct `fetch('/some-api')` calls.

### Demo Backend

Recommended shape:

```text
backend/ or demo-backend/
  README.md
  app/main.py or server.ts
  app/reset_demo_data.py or reset.ts
  data/seed.json
  data/current.json
```

If reusing `backend/`, docs must call it the demo backend for Phase 14 and prevent it from being treated as the formal backend.

### State

Use JSON-file state if practical for Phase 14:

- `seed.json` is the source of truth for reset.
- `current.json` stores demo-session changes.
- reset copies seed to current.
- Runtime handlers read/write current.

If existing FastAPI/SQLite code is retained:

- Keep reset command deterministic.
- Keep schema simple and local-only.
- Document SQLite as a local functional-test detail, not a production persistence model.

### API Contract

Every endpoint should document:

- method and path
- request body
- response body
- auth expectations
- demo behavior
- future real backend notes
- possible error codes

### Integration Boundary

Frontend and future backend meet at:

- environment-configurable base URL
- bearer token auth header
- typed request/response bodies
- standard error shape
- health endpoint
- CORS expectations
- streaming endpoint contract
- file upload metadata contract

## Build Order

1. Document demo backend scope and API contract.
2. Decide whether Phase 14 implementation reuses `backend/` or adds a `demo-backend/` directory.
3. Normalize demo data and reset.
4. Fill endpoint gaps.
5. Align frontend env/API mode and service calls.
6. Add integration and AWS readiness docs.
7. Verify demo flow and build.

## Architectural Risk

The main risk is overbuilding the demo backend. Phase 14 should prefer explicit route handlers, small data files, and clear docs over reusable backend frameworks, database abstractions, and deployment infrastructure.

