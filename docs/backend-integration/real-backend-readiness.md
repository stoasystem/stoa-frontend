# Real Backend Readiness

Phase 14 keeps the demo backend replaceable. This document is the bridge for a future formal backend team.

## Environment Contract

| Variable | Purpose | Demo Value | Future Value |
|----------|---------|------------|--------------|
| `VITE_API_MODE` | Selects frontend API mode | `demo` | `staging` or `production` |
| `VITE_API_BASE_URL` | Browser-visible API base URL | `http://localhost:8000` | Real API gateway/base URL |
| `VITE_ENABLE_MSW` | Enables browser request mocking when implemented | `false` | Usually `false` |
| `VITE_ENABLE_DEMO_API` | Allows mock fallback in demo mode | `true` | `false` |

## Shared Requirements

- Backend must support CORS for the frontend origin.
- Authenticated requests use `Authorization: Bearer <token>`.
- Error responses should use `{ "message": string, "code": string }`.
- Health endpoint should identify whether the API is reachable.
- File uploads and streaming must remain backend-owned.
- Frontend must not receive provider credentials, payment secrets, or database details.

## Endpoint Matrix

| Endpoint | Current Demo Support | Future Backend Need |
|----------|----------------------|---------------------|
| `GET /health` | Implemented | Keep uptime and mode/service status. |
| `POST /auth/login` | Implemented with demo credentials | Production auth, password policy, lockout, MFA or SSO as planned. |
| `POST /auth/register` | Implemented as demo-session registration | Production registration, verification, consent, referral attribution. |
| `GET /auth/me` | Implemented with bearer token | Production session/current-user lookup. |
| `GET /conversations` | Implemented for student | Role-filtered persisted conversations. |
| `GET /conversations/:id` | Implemented for student | Authorization, messages, attachments, model metadata if needed. |
| `POST /conversations` | Implemented | Production persistence and initial-message behavior. |
| `POST /conversations/:id/messages` | Implemented with deterministic reply | Real AI orchestration behind backend API. |
| `POST /conversations/:id/messages/stream` | Implemented as mock SSE | Production streaming, cancellation, retry semantics. |
| `POST /teacher-help/request` | Implemented | Production routing and tutor assignment logic. |
| `GET /teacher-help/request/:id` | Implemented | Student-visible request status. |
| `GET /tutors/me/help-requests` | Implemented | Tutor authorization, filtering, pagination. |
| `GET /tutors/me/help-requests/:id` | Implemented | Full conversation context and notes. |
| `PATCH /tutors/me/help-requests/:id` | Implemented | Production workflow and audit trail. |
| `GET /parents/me/children` | Implemented | Parent-child authorization and data isolation. |
| `GET /parents/me/children/:id/summary` | Implemented | Real progress aggregation. |
| `GET /parents/me/children/:id/history` | Implemented | Real learning history. |
| `GET /parents/me/children/:id/report` | Implemented | Generated weekly reports. |
| `GET /parents/me/children/:id/monthly-report` | Implemented as placeholder | Real monthly trend generation. |
| `GET /billing/plans` | Implemented as static data | Product plan source of truth. |
| `GET /billing/subscription` | Implemented as static data | Real subscription/customer status. |
| `GET /billing/usage` | Implemented as static data | Real quota and usage accounting. |
| `GET /billing/feature-access` | Implemented as static data | Backend-enforced feature access. |
| `POST /billing/checkout-session` | Implemented as mock URL | Hosted checkout session creation. |
| `GET /referrals/me` | Implemented as static data | Real referral code and invite tracking. |
| `POST /feedback` | Implemented | Production feedback intake and triage. |
| `POST /support/requests` | Implemented | Production support tooling integration. |
| `POST /support/tickets` | Implemented | Production ticket creation. |
| `GET /support/tickets` | Implemented | User-scoped ticket list. |
| `GET /support/tickets/:id` | Implemented | Ticket detail authorization. |
| `GET /admin/analytics/overview` | Implemented | Production metrics and privacy-safe aggregation. |
| `GET /admin/support/tickets` | Implemented | Admin support triage. |
| `PATCH /admin/support/tickets/:id` | Implemented | Admin ticket workflow. |
| `GET /admin/help-requests` | Implemented | Operational help-request monitoring. |
| `GET /admin/feedback` | Implemented | Feedback triage. |
| `GET /admin/usage-summary` | Implemented | Admin operational usage. |
| `GET /admin/users` | Implemented | Future admin user management. |
| `GET /admin/billing-interest` | Implemented | Commercial intent tracking. |
| `GET /admin/system-status` | Implemented | Operational status integration. |

## Status Codes

- `200`: Successful read/update.
- `201`: Optional for future created resources; demo backend often uses `200`.
- `400`: Validation error.
- `401`: Missing, invalid, or expired token.
- `403`: Authenticated user lacks required role.
- `404`: Resource not found or not visible to the current user.
- `500`: Unexpected backend failure.

## Migration Checklist

- [ ] Real backend implements the endpoint matrix.
- [ ] Real backend returns `{ message, code }` errors.
- [ ] Real backend supports frontend CORS origins.
- [ ] Frontend `VITE_API_BASE_URL` points at staging backend.
- [ ] Frontend `VITE_API_MODE=staging`.
- [ ] Frontend `VITE_ENABLE_DEMO_API=false`.
- [ ] Auth token format and storage migration are planned.
- [ ] File upload contract is confirmed.
- [ ] Streaming contract is confirmed.
- [ ] Billing checkout is hosted and backend-created.
- [ ] Admin/support/analytics payload privacy is reviewed.

