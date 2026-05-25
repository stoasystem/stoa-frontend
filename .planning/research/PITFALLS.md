# Phase 14 Research: Pitfalls

## Question

What mistakes are common when adding demo backend support to an existing frontend, and how should Phase 14 prevent them?

## Pitfalls and Prevention

### Pitfall: Demo backend becomes production backend by accident

Warning signs:
- ORM models, migrations, production deployment config, cloud resources, or security architecture appear in the milestone.
- Docs describe demo behavior as production-ready.

Prevention:
- Keep Phase 14 language explicit: demo-only, replaceable, frontend demo/test support.
- Add real backend readiness docs instead of production implementation.

### Pitfall: Mock data leaks into page components

Warning signs:
- Components call `fetch('/endpoint')` directly.
- Components import demo seed JSON.
- Different pages duplicate endpoint paths or response mapping.

Prevention:
- Route all API calls through `src/services/**`.
- Add service-layer audit as a requirement.
- Keep API mode in config, not in components.

### Pitfall: State changes cannot be demonstrated

Warning signs:
- All endpoints return static data.
- Teacher help, support ticket, register, and checkout flows cannot show state progression.

Prevention:
- Use session or JSON-file demo state for mutable flows.
- Provide a reset command.
- Define which state changes must persist during the running demo session.

### Pitfall: Reset is unreliable

Warning signs:
- Demo accounts differ between runs.
- Parent-child linkage breaks after reset.
- Pending tutor requests disappear.

Prevention:
- Keep a single seed source.
- Reset fixed users, conversations, reports, help requests, billing, referrals, support, and admin data.
- QA reset before core flow testing.

### Pitfall: Auth looks real but is not secure

Warning signs:
- Demo token is described as JWT.
- Password handling is framed as production-safe.
- Frontend assumes demo token semantics.

Prevention:
- Document demo tokens as opaque placeholder tokens.
- Still send `Authorization: Bearer <token>` so future backend integration remains aligned.
- Keep production auth explicitly out of scope.

### Pitfall: Billing demo implies real payment

Warning signs:
- Frontend asks for card details.
- Mock checkout resembles live Stripe without clear labels.
- Subscription enforcement is presented as real.

Prevention:
- Use local mock checkout success/cancel URLs.
- Document no webhook and no real payment.
- Keep feature access advisory in frontend and backend-owned later.

### Pitfall: Research creates unnecessary dependencies

Warning signs:
- Adding MSW, json-server, Express, and FastAPI all at once.
- Introducing a second backend runtime when the existing local backend is enough.

Prevention:
- Pick one primary demo backend path.
- Keep optional MSW mode documented for future or test-specific use.
- Avoid adding packages unless a roadmap phase proves they are needed.

### Pitfall: Future backend team lacks a clear handoff

Warning signs:
- Endpoints exist only in code.
- Error formats are inconsistent.
- CORS, auth headers, upload, streaming, and env variables are undocumented.

Prevention:
- Create `docs/backend-integration/real-backend-readiness.md`.
- Create `docs/backend-integration/aws-readiness-notes.md`.
- Include endpoint matrix and migration checklist.

