# Phase 14 Research Summary

## Sources

- MSW official site: https://mswjs.io/
- json-server official repository: https://github.com/typicode/json-server
- Express basic routing docs: https://expressjs.com/en/starter/basic-routing.html
- FastAPI first steps docs: https://fastapi.tiangolo.com/tutorial/first-steps/

## Stack Additions

No large stack addition is required for Phase 14.

The most pragmatic path is to reuse and stabilize the existing local FastAPI demo/test backend if it already covers much of the API surface, while documenting it as demo-only and keeping it replaceable. MSW remains useful for optional `mock` mode and test-specific network interception, but Phase 14 should not depend on building a full MSW layer if a local demo backend is the immediate need.

Required frontend configuration additions:

- `VITE_API_MODE`
- `VITE_API_BASE_URL`
- `VITE_ENABLE_MSW`
- `src/lib/env.ts` exports for API mode/base URL/MSW flag
- API service audit to prevent component-level direct API calls

## Feature Table Stakes

- Demo backend scope and non-production boundary.
- Fixed demo accounts for student, parent, tutor, and admin.
- Auth login/register/me with bearer-token-shaped demo flow.
- Conversations and messages with deterministic demo assistant replies.
- Teacher help request/list/detail/status update.
- Parent children, summary, history, weekly report, and monthly report placeholder.
- Billing plans, subscription, usage, feature access, and mock checkout.
- Referral code and invite URL.
- Feedback/support ticket create/list/detail.
- Admin analytics, support tickets, help requests, and feedback.
- Health check and reset command.
- Standard error response `{ message, code }`.
- Backend integration and AWS readiness documentation.
- README and QA checklist updates.

## Watch Out For

- Do not let the demo backend become formal backend architecture.
- Do not add complex database, ORM, migration, Docker, Kubernetes, AWS, payment, auth, or AI orchestration work.
- Do not scatter mock data or endpoint URLs inside page components.
- Do not imply demo tokens, mock checkout, AI replies, analytics, or admin data are production-ready.
- Do not leave reset behavior implicit.

## Recommended Requirement Categories

- Scope and documentation
- Demo data and reset
- Auth and health
- Student chat
- Teacher help and tutor handling
- Parent reports and learning history
- Billing, referral, support, and admin demos
- Frontend API mode and service alignment
- Integration readiness and QA

