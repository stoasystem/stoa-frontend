# Phase 14 Research: Features

## Question

How should Phase 14 demo backend features work so the existing frontend can demonstrate complete flows without adding product scope?

## Table Stakes

### Demo Backend Boundary

- The demo backend is explicitly a frontend demo and test tool.
- It has a documented scope and replacement boundary.
- It exposes API contracts that future real backend teams can implement.
- It avoids formal production architecture.

### Auth Demo

- Fixed student, parent, tutor, and admin accounts.
- Demo login returns an access token and user object.
- Demo tokens are not real JWTs but are used like bearer tokens by the frontend.
- `/auth/me` resolves current user from the authorization header.
- Register returns a fake/current-session user without production auth promises.

### Student Chat Demo

- Student can list, open, and create conversations.
- Student can send messages and receive deterministic demo assistant responses.
- Uploaded file metadata can appear in at least one conversation or message flow.
- Streaming can be mocked or documented as a non-blocking future-compatible endpoint.

### Teacher Help Demo

- Student can request teacher help from a conversation.
- Tutor can list pending/in-progress/resolved requests.
- Tutor can open details and update status.
- Student and parent surfaces can reflect the changed status in the same demo session where practical.

### Parent Demo

- Parent is linked to one child.
- Parent can view child summary, learning history, weekly report, monthly report placeholder, recent questions, and teacher help records.

### Billing Demo

- Plans, subscription, usage quota, feature access, and mock checkout session are available.
- Mock checkout returns a local frontend URL such as `/billing/success?plan=family`.
- No card data, payment secrets, Stripe webhook, or real subscription enforcement.

### Referral, Support, and Admin Demo

- Referral returns a stable code and invite URL.
- Support/feedback can create items visible in the current demo session.
- Admin endpoints return analytics overview, support tickets, feedback, help requests, and billing interest mock data.

### Reset and Health

- `/health` distinguishes demo backend uptime from frontend issues.
- Reset command restores fixed demo state and clears temporary session data.
- Error responses use `{ message, code }`.

## Differentiators Worth Including

- API mode documentation for `mock`, `demo`, `staging`, and `production`.
- Real backend readiness matrix mapping each endpoint to request/response, current demo status, future backend owner, status codes, error codes, and env vars.
- AWS readiness notes limited to frontend-facing integration boundaries.
- QA checklist that walks through the exact end-to-end demo path.

## Anti-Features

- Production auth system.
- Refresh tokens and password-security architecture.
- Production database schema.
- Real AI model provider orchestration.
- Real streaming infrastructure.
- Real payment webhooks.
- Real subscription enforcement.
- Production analytics storage.
- AWS deployment.

## Recommended Scope

Phase 14 should ship enough endpoint behavior and documentation for the complete demo path:

1. User registers or logs in.
2. Student asks an AI question and receives a demo response.
3. Student requests teacher help.
4. Tutor marks the request resolved.
5. Parent sees child learning records/report.
6. Parent opens pricing/billing and completes mock checkout.
7. User sees subscription status.
8. Referral, support, and admin demo pages work.

