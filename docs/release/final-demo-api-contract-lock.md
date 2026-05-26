# Final Demo API Contract Lock

## Goal

Lock the launch-candidate demo backend API contract used by the STOA frontend demo.

## Locked Endpoints

Auth:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`

Student conversations:

- `GET /conversations`
- `POST /conversations`
- `GET /conversations/:id`
- `POST /conversations/:id/messages`
- `POST /conversations/:id/messages/stream`

Files:

- `POST /files`
- `POST /files/tutor-credentials`

Teacher help and tutor:

- `POST /teacher-help/request`
- `GET /teacher-help/request/:requestId`
- `GET /tutors/me/help-requests`
- `GET /tutors/me/help-requests/:requestId`
- `PATCH /tutors/me/help-requests/:requestId`

Parent:

- `GET /parents/me/children`
- `GET /parents/me/children/:childId/summary`
- `GET /parents/me/children/:childId/history`
- `GET /parents/me/children/:childId/report`
- `GET /parents/me/children/:childId/monthly-report`

Billing:

- `GET /billing/plans`
- `GET /billing/subscription`
- `GET /billing/usage`
- `GET /billing/feature-access`
- `POST /billing/checkout-session`

Contact and support:

- `POST /contact/requests`
- `POST /support/tickets`
- `GET /support/tickets`
- `GET /support/tickets/:ticketId`

Admin:

- `GET /admin/analytics/overview`
- `GET /admin/support/tickets`
- `PATCH /admin/support/tickets/:ticketId`
- `GET /admin/billing-interest`
- Admin help-request and feedback visibility where supported by the current admin pages.

Health:

- `GET /health`

## Error Shape

Demo backend errors should keep the documented shape:

```json
{
  "message": "Invalid demo credentials",
  "code": "DEMO_INVALID_CREDENTIALS"
}
```

## Change Rules

- Do not change request or response shapes after lock unless the change fixes a launch-candidate blocker.
- Any required contract change must update frontend services, demo backend behavior, demo docs, and release docs together.
- Any required contract change triggers a new demo reset check and core demo-flow retest.
- Staging or production backend contracts must remain backend-owned future work.

## Demo Boundary

This lock applies to the local demo/backend-mode frontend launch candidate. It is not a production backend architecture decision.

