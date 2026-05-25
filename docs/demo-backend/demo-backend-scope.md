# Demo Backend Scope

Phase 14 stabilizes a lightweight demo backend for frontend testing and product demonstrations. It is not the STOA production backend, not a backend architecture proposal, and not the source of truth for future cloud infrastructure.

## Purpose

The demo backend exists to let developers and stakeholders run a complete STOA demonstration locally:

1. Register or log in with fixed demo accounts.
2. Ask a student AI question and receive a deterministic demo response.
3. Request teacher help.
4. Resolve the request as a tutor.
5. View child learning records and reports as a parent.
6. Exercise pricing, billing, mock checkout, referral, support, and admin demo screens.

## Responsibilities

- Serve stable demo API responses for current frontend flows.
- Preserve mutable demo state during a local session where useful.
- Reset to known demo data through a single command.
- Return consistent demo error responses.
- Keep API contracts close to the future backend boundary.
- Document all endpoints the frontend depends on.

## Non-Goals

- Production authentication, password security, refresh tokens, or session management.
- Production database schema, ORM, migration, or multi-tenant design.
- Real AI provider orchestration or production streaming infrastructure.
- Stripe webhook handling or real subscription enforcement.
- Production analytics, admin backend, support tooling, or AWS deployment.

## Replacement Boundary

The frontend must depend on API contracts, not demo backend internals. Future real backend work can replace the demo backend as long as it preserves the documented request/response contracts or intentionally migrates them with frontend coordination.

The demo backend may use local SQLite, JSON files, in-memory state, or MSW-style mocks. Those choices are implementation details for local development only.

## Recommended Local Mode

Use the local demo backend at `http://localhost:8000` with:

```bash
npm run demo:backend
npm run demo:reset
```

Frontend API mode should be configured as:

```bash
VITE_API_MODE=demo
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MSW=false
```

