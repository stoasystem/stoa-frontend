# Phase 11 frontend-only boundary

Phase 11 is a frontend milestone. It designs and demonstrates paid launch, growth, tutor operations, support, admin analytics, and attribution flows without implementing a production backend.

## In scope

- React pages, components, hooks, and service clients.
- API contracts for billing, referrals, tutor availability, support tickets, and admin analytics.
- Demo/mock fallback data for local development and E2E tests.
- Virtual checkout flow for frontend validation.
- Documentation that separates demo infrastructure from production backend architecture.

## Out of scope

- Production payment webhook handling.
- Real subscription enforcement.
- Formal billing database design.
- Production analytics backend.
- Production support ticket backend.
- Full CRM, BI, invoice, payroll, or school multi-tenant backend.

## Existing local backend status

The `backend/` FastAPI and SQLite-oriented files are demo/test support only. They are not the formal STOA backend architecture and should not grow into production billing, subscription, analytics, support, admin, or database services during this frontend milestone.

Future backend work can replace the current demo responses behind the documented API contracts.
