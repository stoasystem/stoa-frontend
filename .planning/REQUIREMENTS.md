# Requirements: STOA Frontend

**Defined:** 2026-05-25
**Milestone:** v1.13 Phase 14: Demo Backend Stabilization, Test Flow Completion, and Backend Integration Readiness
**Core Value:** Developers can clone `stoa-frontend`, run the npm scripts, and use a credible STOA education platform workflow with authenticated role boundaries, clear role-based navigation, stable demo backend support, documented API contracts, coherent demo flows, and a clean path to future real backend integration.

## v1.13 Requirements

Requirements for Phase 14. Each requirement maps to exactly one roadmap phase.

### Scope and Documentation

- [ ] **SCOPE-01**: Team can review `docs/demo-backend/demo-backend-scope.md` defining demo backend responsibilities, replacement boundary, and explicit non-production scope.
- [ ] **SCOPE-02**: Team can review `docs/demo-backend/demo-api-contract.md` documenting all Phase 14 demo endpoints, request/response shapes, auth expectations, status codes, and error codes.
- [ ] **SCOPE-03**: Team can review `docs/demo-backend/demo-data.md` documenting fixed demo accounts, role relationships, conversations, parent reports, tutor requests, billing, referrals, support, and admin mock data.
- [ ] **SCOPE-04**: Team can review `docs/demo-backend/demo-reset-flow.md` documenting how demo state is reset and what data must be restored.

### Demo Data and Reset

- [ ] **DATA-01**: Demo data includes fixed `student@test.com`, `parent@test.com`, `tutor@test.com`, and `admin@test.com` accounts using `password123`.
- [ ] **DATA-02**: Demo data includes student conversations, messages, uploaded file metadata, learning history, weak topics, and recommended next actions.
- [ ] **DATA-03**: Demo data includes parent-child linkage, child summary, weekly report, monthly report placeholder, recent questions, and teacher help records.
- [ ] **DATA-04**: Demo data includes tutor pending, in-progress, and resolved help requests plus availability and stats.
- [ ] **DATA-05**: Demo data includes billing plans, subscription, usage quota, feature access, mock checkout behavior, referral data, support/feedback data, and admin analytics.
- [ ] **DATA-06**: A reset command restores fixed demo data and clears temporary registration/support/session changes.

### Auth and Health

- [ ] **AUTH-01**: `GET /health` returns demo backend health with `ok`, service name, and mode.
- [ ] **AUTH-02**: `POST /auth/login` accepts fixed demo credentials and returns an opaque demo access token plus user object.
- [ ] **AUTH-03**: `POST /auth/register` supports mock registration for the current demo session without implying production auth.
- [ ] **AUTH-04**: `GET /auth/me` resolves current user from the `Authorization: Bearer <token>` header.
- [ ] **AUTH-05**: Auth failures and unauthorized requests return standard `{ message, code }` demo error responses.

### Student Chat

- [ ] **CHAT-01**: Student can list own demo conversations through `GET /conversations`.
- [ ] **CHAT-02**: Student can open a conversation through `GET /conversations/:conversationId`.
- [ ] **CHAT-03**: Student can create a temporary conversation through `POST /conversations`.
- [ ] **CHAT-04**: Student can send a message through `POST /conversations/:conversationId/messages` and receive a deterministic demo assistant answer.
- [ ] **CHAT-05**: Demo backend preserves message/conversation changes for the current demo session or until reset.
- [ ] **CHAT-06**: Streaming message behavior is supported by a mock endpoint or documented as a future-compatible non-blocking contract.

### Teacher Help and Tutor Handling

- [ ] **HELP-01**: Student can request teacher help through `POST /teacher-help/request`.
- [ ] **HELP-02**: Tutor can list assigned help requests through `GET /tutors/me/help-requests`.
- [ ] **HELP-03**: Tutor can open a request detail through `GET /tutors/me/help-requests/:requestId`.
- [ ] **HELP-04**: Tutor can update request status through `PATCH /tutors/me/help-requests/:requestId`.
- [ ] **HELP-05**: Student and parent related views can observe help-request status changes during the current demo session where applicable.

### Parent Reports

- [ ] **PARENT-01**: Parent can list linked children through `GET /parents/me/children`.
- [ ] **PARENT-02**: Parent can view child summary through `GET /parents/me/children/:childId/summary`.
- [ ] **PARENT-03**: Parent can view child learning history through `GET /parents/me/children/:childId/history`.
- [ ] **PARENT-04**: Parent can view child weekly report through `GET /parents/me/children/:childId/report`.
- [ ] **PARENT-05**: Parent can view a monthly report placeholder through `GET /parents/me/children/:childId/monthly-report`.

### Billing, Referral, Support, and Admin Demo APIs

- [ ] **OPS-01**: Billing demo exposes plans, subscription, usage, feature access, and mock checkout session endpoints.
- [ ] **OPS-02**: Mock checkout returns a local checkout success URL and does not collect card data or call real Stripe.
- [ ] **OPS-03**: Referral demo exposes stable referral code, invite URL, and successful invite count.
- [ ] **OPS-04**: Feedback and support ticket APIs allow creating and viewing demo-session items.
- [ ] **OPS-05**: Admin demo APIs expose analytics overview, support tickets, help requests, and feedback.
- [ ] **OPS-06**: Demo backend applies consistent error responses across billing, referral, support, and admin endpoints.

### Frontend API Mode and Service Alignment

- [ ] **API-01**: `.env.example` documents `VITE_API_MODE`, `VITE_API_BASE_URL`, and `VITE_ENABLE_MSW`.
- [ ] **API-02**: `src/lib/env.ts` exposes API mode, base URL, and MSW flag with safe defaults.
- [ ] **API-03**: Shared API client uses the configured API base URL and preserves bearer-token request behavior.
- [ ] **API-04**: API mode values `mock`, `demo`, `staging`, and `production` are documented for frontend developers.
- [ ] **API-05**: Frontend API usage is audited so page components do not hard-code endpoint URLs or import demo backend internals.

### Integration Readiness and QA

- [ ] **READY-01**: `docs/backend-integration/real-backend-readiness.md` maps current frontend endpoints to request/response contracts, demo coverage, future backend ownership, status codes, error codes, env vars, CORS, and auth headers.
- [ ] **READY-02**: `docs/backend-integration/aws-readiness-notes.md` documents frontend-facing AWS readiness concerns without implementing AWS deployment.
- [ ] **READY-03**: `docs/qa/demo-backend-qa.md` includes startup, health, reset, auth, chat, teacher help, parent, billing, referral, support, admin, and future integration checks.
- [ ] **READY-04**: README documents Phase 14 demo backend workflow, demo accounts, run/reset commands, API modes, and non-production boundary.
- [ ] **READY-05**: Complete demo flow is manually or automatically verified against the demo backend.
- [ ] **READY-06**: `npm run build` passes after Phase 14 changes.

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Phase 15 Quality Hardening

- **DS-01**: Team can review component documentation for Button, Card, Form, Table, Badge, layout primitives, and shared state components.
- **DS-02**: Team can review a consolidated token system for colors, typography, spacing, borders, shadows, and motion.
- **A11Y-01**: App has accessibility audit coverage for keyboard navigation, screen reader labels, focus states, and color contrast.
- **QA-UI-01**: App has visual regression or screenshot comparison coverage for major route surfaces.

### Production Backend

- **BACKEND-01**: Formal backend implements production authentication, authorization, persistence, AI orchestration, payment webhooks, subscription enforcement, analytics storage, support workflows, and admin operations.
- **AWS-01**: Production infrastructure deploys through a separately planned backend/cloud milestone.

## Out of Scope

Explicitly excluded from v1.13 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Formal production backend | Phase 14 stabilizes demo backend support only. |
| Complex database schema or migrations | Demo data should remain simple, resettable, and replaceable. |
| Production authentication or refresh tokens | Demo auth uses fixed accounts and opaque demo tokens for frontend flow testing. |
| Real password security architecture | Demo credentials are fixed and not production security infrastructure. |
| Real AI provider orchestration | Demo assistant responses are deterministic mock responses behind backend-shaped APIs. |
| Real streaming infrastructure | Streaming can be mocked or documented, but production streaming belongs to the real backend. |
| Real Stripe checkout or webhooks | Billing remains virtual/mock and must not collect card data. |
| Real subscription enforcement | Frontend feature access remains advisory; backend enforcement is future work. |
| AWS deployment or CDK architecture | Phase 14 documents readiness notes only. |
| New product modules | Phase 14 supports existing demo surfaces rather than expanding STOA product breadth. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCOPE-01 | Phase 80 | Complete |
| SCOPE-02 | Phase 80 | Complete |
| SCOPE-03 | Phase 80 | Complete |
| SCOPE-04 | Phase 80 | Complete |
| DATA-01 | Phase 81 | Complete |
| DATA-02 | Phase 81 | Complete |
| DATA-03 | Phase 81 | Complete |
| DATA-04 | Phase 81 | Complete |
| DATA-05 | Phase 81 | Complete |
| DATA-06 | Phase 81 | Complete |
| AUTH-01 | Phase 82 | Complete |
| AUTH-02 | Phase 82 | Complete |
| AUTH-03 | Phase 82 | Complete |
| AUTH-04 | Phase 82 | Complete |
| AUTH-05 | Phase 82 | Complete |
| CHAT-01 | Phase 82 | Complete |
| CHAT-02 | Phase 82 | Complete |
| CHAT-03 | Phase 82 | Complete |
| CHAT-04 | Phase 82 | Complete |
| CHAT-05 | Phase 82 | Complete |
| CHAT-06 | Phase 82 | Complete |
| HELP-01 | Phase 83 | Complete |
| HELP-02 | Phase 83 | Complete |
| HELP-03 | Phase 83 | Complete |
| HELP-04 | Phase 83 | Complete |
| HELP-05 | Phase 83 | Complete |
| PARENT-01 | Phase 83 | Complete |
| PARENT-02 | Phase 83 | Complete |
| PARENT-03 | Phase 83 | Complete |
| PARENT-04 | Phase 83 | Complete |
| PARENT-05 | Phase 83 | Complete |
| OPS-01 | Phase 84 | Complete |
| OPS-02 | Phase 84 | Complete |
| OPS-03 | Phase 84 | Complete |
| OPS-04 | Phase 84 | Complete |
| OPS-05 | Phase 84 | Complete |
| OPS-06 | Phase 84 | Complete |
| API-01 | Phase 85 | Pending |
| API-02 | Phase 85 | Pending |
| API-03 | Phase 85 | Pending |
| API-04 | Phase 85 | Pending |
| API-05 | Phase 85 | Pending |
| READY-01 | Phase 86 | Pending |
| READY-02 | Phase 86 | Pending |
| READY-03 | Phase 86 | Pending |
| READY-04 | Phase 86 | Pending |
| READY-05 | Phase 86 | Pending |
| READY-06 | Phase 86 | Pending |

**Coverage:**
- v1.13 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after Phase 14 roadmap creation*
